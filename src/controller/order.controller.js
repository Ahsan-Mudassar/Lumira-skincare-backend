import {
    createOrder as placeOrder,
    trackOrder as findOrderForTracking,
    toPublicOrder,
    toPublicTracking,
    dispatchOrderEmail
} from "../services/order.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createOrder = asyncHandler(async (req, res) => {
    const { customer, shippingAddress, items } = req.validated?.body ?? req.body;
    const idempotencyKey = req.validated?.headers?.["idempotency-key"] ?? req.headers["idempotency-key"];

    const { order, replayed } = await placeOrder({
        customer,
        shippingAddress,
        items,
        idempotencyKey
    });

    if (replayed) {
        res.set("Idempotent-Replayed", "true");
        return res.status(200).json(
            new ApiResponse(200, toPublicOrder(order), "Order was already placed")
        );
    }

    res.status(201).json(
        new ApiResponse(201, toPublicOrder(order), "Order placed successfully")
    );
    dispatchOrderEmail(order).catch((err) =>
        console.error(`[email] ${order.orderNumber}:`, err.message)
    );
});

export const trackOrder = asyncHandler(async (req, res) => {
    const { orderNumber, email } = req.validated?.body ?? req.body;

    const order = await findOrderForTracking({ orderNumber, email });

    res.status(200).json(new ApiResponse(200, toPublicTracking(order), "Track order successfuly"));
});