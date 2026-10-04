import asyncHandler from "../utils/asyncHandler.js";
import { listOrders, getOrderDetail, changeOrderStatus } from "../services/order.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { resendOrderEmail as resendEmail } from "../services/order.service.js";

// POST /api/admin/orders/:id/resend-email
export const resendOrderEmail = asyncHandler(async (req, res) => {
    const { id } = req.validated.params;
    const { force } = req.validated.query;

    await resendEmail({ orderId: id, force });

    res.status(200).json(new ApiResponse(200, {}, "Order email sent"));
});

// GET /api/admin/orders
export const getAdminOrders = asyncHandler(async (req, res) => {
    const query = req.validated.query ?? req.query;
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

// GET /api/admin/orders/:id
export const getAdminOrderById = asyncHandler(async (req, res) => {
    const { id } = req.validated.params.id ?? req.params.id
    const order = await getOrderDetail(id);
    if (!order) throw new ApiError(400, "Order fetch bu id not found")
    res.status(200).json(new ApiResponse(200, order, "Order by Id fetch succfully"));
});

// PATCH /api/admin/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.validated.params ?? req.params;
    const { status, note } = req.validated.body ?? req.body;

    const order = await changeOrderStatus({
        orderId: id,
        nextStatus: status,
        note,
        adminId: req.user.id
    });

    if (!order) throw new ApiError(400, "Some thing went wrong")

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