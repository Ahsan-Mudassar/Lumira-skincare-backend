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
import {
    getLowStockStats,
    getOverviewStats,
    getSalesStats,
    getTopProductsStats,
    getUnsoldProductsStats
} from "../controller/admin.stats.controller.js";
import {
    lowStockQuerySchema,
    salesQuerySchema,
    topProductsQuerySchema,
    unsoldQuerySchema
} from "../validation/stats.validation.js";
import {
    adminReviewListQuerySchema,
    reviewApprovalSchema,
    reviewIdParamSchema
} from "../validation/review.validation.js";
import {
    getAdminReviews,
    removeReview,
    updateReviewApproval
} from "../controller/admin.review.controller.js";

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

router.get("/stats/overview", getOverviewStats);
router.get("/stats/sales", validate(salesQuerySchema, "query"), getSalesStats);
router.get("/stats/top-products", validate(topProductsQuerySchema, "query"), getTopProductsStats);
router.get("/stats/unsold-products", validate(unsoldQuerySchema, "query"), getUnsoldProductsStats);
router.get("/stats/low-stock", validate(lowStockQuerySchema, "query"), getLowStockStats);

router.get("/reviews", validate(adminReviewListQuerySchema, "query"), getAdminReviews);

router.patch(
    "/reviews/:id/approval",
    validate(reviewIdParamSchema, "params"),
    validate(reviewApprovalSchema),
    updateReviewApproval
);

router.delete("/reviews/:id", validate(reviewIdParamSchema, "params"), removeReview);

export default router;