import mongoose from "mongoose";
import { Product } from "../model/product.model.js";
import { Customer } from "../model/customer.model.js";
import { Order } from "../model/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { getNextOrderNumber } from "../utils/getNextOrderNumber.js";
import { calculateShippingFee } from "../config/store.js";
import { ORDER_STATUS_TRANSITIONS } from "../constants/order.constant.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { sendOrderNotification } from "./email.service.js";

export const dispatchOrderEmail = async (order, { force = false } = {}) => {
    const result = await sendOrderNotification(
        order,
        force ? { idempotencyKey: `order-${order.orderNumber}-${Date.now()}` } : {}
    );

    await Order.updateOne(
        { _id: order._id },
        result.ok
            ? { $set: { emailSent: true, emailSentAt: new Date() }, $unset: { emailError: "" } }
            : { $set: { emailError: String(result.error).slice(0, 300) } }
    );

    return result;
};

export const resendOrderEmail = async ({ orderId, force }) => {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    if (order.emailSent && !force) {
        throw new ApiError(409, "Email was already sent. Use ?force=true to send it again");
    }

    const result = await dispatchOrderEmail(order, { force: order.emailSent });

    if (!result.ok) throw new ApiError(502, `Email could not be sent: ${result.error}`);
    return result;
};

const getMainImage = (product) => {
    const first = product.images?.url?.[0];
    return typeof first === "string" || first;
};

const buildOrderFilter = ({ status, from, to, search }) => {
    const filter = {};

    if (status) filter.status = status;

    if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = from;
        if (to) filter.createdAt.$lt = to;
    }

    if (search) {
        const term = search.replace(/\s+/g, "");
        filter.$or = [
            { orderNumber: new RegExp(`^${escapeRegex(term.toUpperCase())}`) },
            { "customerSnapshot.phone": new RegExp(`^${escapeRegex(term)}`) }
        ];
    }

    return filter;
};

export const listOrders = async (query) => {
    const { page, limit } = query;
    const filter = buildOrderFilter(query);

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select(
                "orderNumber status customerSnapshot.name customerSnapshot.phone " +
                "shippingAddress.city items.quantity total emailSent createdAt"
            )
            .lean(),
        Order.countDocuments(filter)
    ]);

    const data = orders.map(({ items, ...rest }) => ({
        ...rest,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    }));

    return { data, total };
};

export const getOrderDetail = async (orderId) => {
    const order = await Order.findById(orderId)
        .populate("customer", "name email phone createdAt")
        .populate("statusHistory.updatedBy", "name email")
        .lean();

    if (!order) throw new ApiError(404, "Order not found");
    return order;
};

export const changeOrderStatus = async ({ orderId, nextStatus, note, adminId }) => {
    const session = await mongoose.startSession();

    try {
        let updated;

        await session.withTransaction(async () => {
            const order = await Order.findById(orderId).session(session);
            if (!order) throw new ApiError(404, "Order not found");

            const allowed = ORDER_STATUS_TRANSITIONS[order.status] ?? [];
            if (!allowed.includes(nextStatus)) {
                throw new ApiError(
                    409,
                    `Cannot change status from "${order.status}" to "${nextStatus}"`
                );
            }

            const historyEntry = {
                status: nextStatus,
                changedAt: new Date(),
                updatedBy: adminId,
                ...(note && { note })
            };

            updated = await Order.findOneAndUpdate(
                { _id: orderId, status: order.status },
                { $set: { status: nextStatus }, $push: { statusHistory: historyEntry } },
                { returnDocument: 'after', session }
            );

            if (!updated) {
                throw new ApiError(409, "Order was updated by someone else. Please refresh.");
            }

            if (nextStatus === "cancelled") {
                await Product.bulkWrite(
                    order.items.map((item) => ({
                        updateOne: {
                            filter: { _id: item.product },
                            update: { $inc: { stock: item.quantity } }
                        }
                    })),
                    { session }
                );
            }
        });

        return updated;
    } finally {
        await session.endSession();
    }
};

const findOrCreateCustomer = async ({ name, email, phone }) => {
    const existing = await Customer.findOne({ email });
    if (existing) return existing;

    try {
        return await Customer.create({ name, email, phone });
    } catch (err) {
        if (err.code === 11000) {
            const created = await Customer.findOne({ email });
            if (created) return created;
        }
        throw err;
    }
};

export const toPublicOrder = (order) => ({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    customerName: order.customerSnapshot.name,
    city: order.shippingAddress.city,
    items: order.items.map((item) => ({
        name: item.name,
        slug: item.slug,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        lineTotal: item.lineTotal
    })),
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    createdAt: order.createdAt
});

const toPublicItems = (items) =>
    items.map((item) => ({
        name: item.name,
        slug: item.slug,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        lineTotal: item.lineTotal
    }));

export const trackOrder = async ({ orderNumber, email }) => {
    const order = await Order.findOne({
        orderNumber,
        "customerSnapshot.email": email
    }).lean();

    if (!order) throw new ApiError(404, "Order not found");
    return order;
};

export const toPublicTracking = (order) => ({
    orderNumber: order.orderNumber,
    status: order.status,
    statusHistory: order.statusHistory.map(({ status, changedAt }) => ({ status, changedAt })),
    items: toPublicItems(order.items),
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    city: order.shippingAddress.city,
    createdAt: order.createdAt
});

export const createOrder = async ({ customer, shippingAddress, items, idempotencyKey }) => {
    if (idempotencyKey) {
        const existing = await Order.findOne({ idempotencyKey });
        if (existing) return { order: existing, replayed: true };
    }

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true })
        .select("name slug sku price discountPrice images")
        .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    if (productMap.size !== productIds.length) {
        throw new ApiError(400, "Some items in your cart are no longer available");
    }

    const lines = items.map((item) => {
        const product = productMap.get(item.productId);
        const unitPrice = product.discountPrice ?? product.price;

        return {
            productId: product._id,
            quantity: item.quantity,
            snapshot: {
                product: product._id,
                name: product.name,
                slug: product.slug,
                sku: product.sku,
                image: getMainImage(product),
                price: unitPrice,
                quantity: item.quantity,
                lineTotal: unitPrice * item.quantity
            }
        };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.snapshot.lineTotal, 0);
    const shippingFee = calculateShippingFee(subtotal);
    const total = subtotal + shippingFee;

    const customerDoc = await findOrCreateCustomer(customer);
    const orderNumber = await getNextOrderNumber();

    const orderDoc = {
        orderNumber,
        customer: customerDoc._id,
        customerSnapshot: { name: customer.name, email: customer.email, phone: customer.phone },
        shippingAddress,
        items: lines.map((line) => line.snapshot),
        subtotal,
        shippingFee,
        total,
        paymentMethod: "COD",
        status: "pending",
        statusHistory: [{ status: "pending", changedAt: new Date() }],
        emailSent: false,
        ...(idempotencyKey && { idempotencyKey })
    };

    const session = await mongoose.startSession();

    try {
        let order;

        await session.withTransaction(async () => {
            for (const line of lines) {
                const result = await Product.updateOne(
                    { _id: line.productId, isActive: true, stock: { $gte: line.quantity } },
                    { $inc: { stock: -line.quantity } },
                    { session }
                );

                if (result.modifiedCount === 0) {
                    throw new ApiError(409, `Not enough stock for "${line.snapshot.name}"`);
                }
            }

            const [created] = await Order.create([orderDoc], { session });
            order = created;
        });

        return { order, replayed: false };
    } catch (err) {
        if (err.code === 11000 && idempotencyKey) {
            const existing = await Order.findOne({ idempotencyKey });
            if (existing) return { order: existing, replayed: true };
        }
        throw err;
    } finally {
        await session.endSession();
    }
};