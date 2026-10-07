import asyncHandler from "../utils/asyncHandler.js";
import { listOrders, getOrderDetail, changeOrderStatus } from "../services/order.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { resendOrderEmail as resendEmail } from "../services/order.service.js";

export const resendOrderEmail = asyncHandler(async (req, res) => {
    const { id } = req.validated?.params ?? req.params;
    const { force } = req.validated?.query ?? req.query;

    await resendEmail({ orderId: id, force });

    res.status(200).json(new ApiResponse(200, {}, "Order email sent"));
});

export const getAdminOrders = asyncHandler(async (req, res) => {
    const query = req.validated?.query ?? req.query;
    const { data, total } = await listOrders(query);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                count: data.length,
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total,
                    totalPages: Math.ceil(total / query.limit),
                    hasNext: query.page * query.limit < total
                },
                data
            },
            "orders fetch successfully"
        )
    );
});

export const getAdminOrderById = asyncHandler(async (req, res) => {
    const id = req.validated?.params.id ?? req.params.id
    const order = await getOrderDetail(id);
    if (!order) throw new ApiError(400, "Order fetch id not found")
    res.status(200).json(new ApiResponse(200, order, "Order by Id fetch succfully"));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.validated?.params ?? req.params;
    const { status, note } = req.validated?.body ?? req.body;

    const order = await changeOrderStatus({
        orderId: id,
        nextStatus: status,
        note,
        adminId: req.user.id
    });

    if (!order) throw new ApiError(400, "Some thing went wrong whil changing order status")

    res.status(200).json(
        new ApiResponse(
            200,
            {
                id: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                statusHistory: order.statusHistory
            },
            "Update order successfully"
        )
    );
});