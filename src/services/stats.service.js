import { Order } from "../model/order.model.js";
import { Product } from "../model/product.model.js";
import { Customer } from "../model/customer.model.js";
import { Review } from "../model/review.model.js";
import { STORE } from "../config/store.js";

const NOT_CANCELLED = { $ne: "cancelled" };
const IN_PROGRESS = ["pending", "confirmed", "shipped"];

const [, sign, hh, mm] = /^([+-])(\d{2}):(\d{2})$/.exec(STORE.utcOffset);
const OFFSET_MS = (sign === "-" ? -1 : 1) * (Number(hh) * 60 + Number(mm)) * 60_000;

const dateKey = (date) => new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 10);
const startOfKey = (key) => new Date(`${key}T00:00:00${STORE.utcOffset}`);
const shiftKey = (key, deltaDays) => {
    const d = new Date(`${key}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + deltaDays);
    return d.toISOString().slice(0, 10);
};

const windowStart = (days) => startOfKey(shiftKey(dateKey(new Date()), -(days - 1)));

export const getOverview = async () => {
    const todayKey = dateKey(new Date());
    const todayStart = startOfKey(todayKey);
    const monthStart = startOfKey(`${todayKey.slice(0, 7)}-01`);

    const [byStatus, [period = {}], activeProducts, outOfStock, lowStock, pendingReviews, customers, emailFailures] =
        await Promise.all([
            Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, value: { $sum: "$total" } } }]),
            Order.aggregate([
                { $match: { status: NOT_CANCELLED, createdAt: { $gte: monthStart } } },
                {
                    $group: {
                        _id: null,
                        monthOrders: { $sum: 1 },
                        monthSales: { $sum: "$total" },
                        todayOrders: { $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, 1, 0] } },
                        todaySales: { $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, "$total", 0] } }
                    }
                }
            ]),
            Product.countDocuments({ isActive: true }),
            Product.countDocuments({ isActive: true, stock: 0 }),
            Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: STORE.lowStockThreshold } }),
            Review.countDocuments({ isApproved: false }),
            Customer.estimatedDocumentCount(),
            Order.countDocuments({ emailSent: false, status: NOT_CANCELLED })
        ]);

    const orders = { total: 0, pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    let collected = 0;
    let awaitingDelivery = 0;

    for (const row of byStatus) {
        orders[row._id] = row.count;
        orders.total += row.count;
        if (row._id === "delivered") collected = row.value;
        if (IN_PROGRESS.includes(row._id)) awaitingDelivery += row.value;
    }

    return {
        orders,
        revenue: {
            collected,
            awaitingDelivery,
            today: { orders: period.todayOrders ?? 0, sales: period.todaySales ?? 0 },
            thisMonth: { orders: period.monthOrders ?? 0, sales: period.monthSales ?? 0 }
        },
        products: { active: activeProducts, outOfStock, lowStock, lowStockThreshold: STORE.lowStockThreshold },
        reviews: { pending: pendingReviews },
        customers: { total: customers },
        alerts: { ordersWithoutEmail: emailFailures }
    };
};

export const getSalesHistory = async ({ days }) => {
    const rows = await Order.aggregate([
        { $match: { status: NOT_CANCELLED, createdAt: { $gte: windowStart(days) } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: STORE.utcOffset } },
                orders: { $sum: 1 },
                sales: { $sum: "$total" }
            }
        }
    ]);

    const byDate = new Map(rows.map((r) => [r._id, r]));
    const todayKey = dateKey(new Date());

    const series = Array.from({ length: days }, (_, i) => {
        const date = shiftKey(todayKey, -(days - 1 - i));
        const row = byDate.get(date);
        return { date, orders: row?.orders ?? 0, sales: row?.sales ?? 0 };
    });

    const totals = series.reduce(
        (t, d) => ({ orders: t.orders + d.orders, sales: t.sales + d.sales }),
        { orders: 0, sales: 0 }
    );

    return { series, totals };
};

export const getTopProducts = ({ days, limit }) =>
    Order.aggregate([
        { $match: { status: NOT_CANCELLED, createdAt: { $gte: windowStart(days) } } },
        { $sort: { createdAt: 1 } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.product",
                name: { $last: "$items.name" },
                slug: { $last: "$items.slug" },
                image: { $last: "$items.image" },
                unitsSold: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.lineTotal" },
                orders: { $sum: 1 }
            }
        },
        { $sort: { unitsSold: -1, revenue: -1 } },
        { $limit: parseInt(limit,10) },
        { $project: { _id: 0, productId: "$_id", name: 1, slug: 1, image: 1, unitsSold: 1, revenue: 1, orders: 1 } }
    ]);

export const getUnsoldProducts = async ({ days, limit }) => {
    const since = windowStart(days);

    const soldIds = await Order.distinct("items.product", {
        status: NOT_CANCELLED,
        createdAt: { $gte: since }
    });

    return Product.find({ isActive: true, createdAt: { $lt: since }, _id: { $nin: soldIds } })
        .select("name slug sku price stock images createdAt")
        .sort({ createdAt: 1 })
        .limit(limit)
        .lean();
};

export const getLowStockProducts = ({ threshold, limit }) =>
    Product.find({ isActive: true, stock: { $lte: threshold } })
        .select("name slug sku stock images")
        .sort({ stock: 1, name: 1 })
        .limit(limit)
        .lean();