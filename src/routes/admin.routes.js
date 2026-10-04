import { Router } from "express";
import {
    getAdminOrders,
    getAdminOrderById,
    updateOrderStatus,
    resendOrderEmail as resendEmail
} from "../controller/admin.order.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { noStore } from "../middlewares/noStore.middleware.js";
import {
    adminOrderListQuerySchema,
    orderIdParamSchema,
    resendEmailQuerySchema,
    updateOrderStatusSchema
} from "../validation/order.validation.js";

const router = Router();

router.use(noStore, protect, adminOnly);

router.get("/orders", validate(adminOrderListQuerySchema, "query"), getAdminOrders);

router.get("/orders/:id", validate(orderIdParamSchema, "params"), getAdminOrderById);

router.patch(
    "/orders/:id/status",
    validate(orderIdParamSchema, "params"),
    validate(updateOrderStatusSchema),
    updateOrderStatus
);
router.post(
    "/orders/:id/resend-email",
    validate(orderIdParamSchema, "params"),
    validate(resendEmailQuerySchema, "query"),
    resendEmail
);

export default router;