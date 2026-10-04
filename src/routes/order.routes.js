import { Router } from "express";
import { createOrder, trackOrder } from "../controller/order.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { noStore } from "../middlewares/noStore.middleware.js";
import { orderLimiter, trackLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
    checkoutSchema,
    trackOrderSchema,
    idempotencyHeaderSchema
} from "../validation/order.validation.js";

const router = Router();

router.post(
    "/",
    orderLimiter,
    noStore,
    validate(idempotencyHeaderSchema, "headers"),
    validate(checkoutSchema),
    createOrder
);

router.post("/track", trackLimiter, noStore, validate(trackOrderSchema), trackOrder);

export default router;