import { z } from "zod";
import { STORE } from "../config/store.js";

const days = z.coerce.number().int().min(1).max(365).default(30);

export const salesQuerySchema = z.object({ days });

export const topProductsQuerySchema = z.object({
    days,
    limit: z.coerce.number().int().min(1).max(20).default(5)
});

export const unsoldQuerySchema = z.object({
    days,
    limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const lowStockQuerySchema = z.object({
    threshold: z.coerce.number().int().min(0).max(1000).default(STORE.lowStockThreshold),
    limit: z.coerce.number().int().min(1).max(100).default(50)
});