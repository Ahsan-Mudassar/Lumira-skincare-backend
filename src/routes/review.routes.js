import { Router } from "express";
import { submitReview } from "../controller/review.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { reviewLimiter } from "../middlewares/rateLimiter.middleware.js";
import { createReviewSchema } from "../validation/review.validation.js";

const router = Router();

router.post("/", reviewLimiter, validate(createReviewSchema), submitReview);

export default router;