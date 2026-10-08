import { z } from "zod";
import { trackOrderSchema } from "./order.validation.js";

const { orderNumber, email } = trackOrderSchema.shape;

const objectId = (label) =>
    z.string().trim().toLowerCase().regex(/^[0-9a-fA-F]{24}$/, `Invalid ${label} id`);

const page = z.coerce.number().int().min(1).max(500).default(1);

export const createReviewSchema = z
    .object({
        orderNumber,
        email,
        productId: objectId("product"),
        rating: z
            .number()
            .int("Rating must be a whole number")
            .min(1, "Minimum rating is 1")
            .max(5, "Maximum rating is 5"),
        title: z.string().trim().max(100, "Title is too long").optional().transform((v) => v || undefined),
        comment: z.string().trim().min(10, "Review must be at least 10 characters").max(1000, "Review is too long")
    })
    .strict();

export const productReviewsQuerySchema = z.object({
    sort: z.enum(["newest", "highest", "lowest"]).default("newest"),
    page,
    limit: z.coerce.number().int().min(1).max(20).default(10)
});

export const adminReviewListQuerySchema = z.object({
    status: z.enum(["pending", "approved", "all"]).default("pending"),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    page,
    limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const reviewIdParamSchema = z.object({ id: objectId("review") });

export const reviewApprovalSchema = z.object({ isApproved: z.boolean() }).strict();