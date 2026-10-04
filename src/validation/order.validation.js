import { z } from "zod";
import {
    ORDER_STATUSES,
    MAX_ORDER_ITEMS,
    MAX_ITEM_QUANTITY
} from "../constants/order.constant.js";
import { STORE } from "../config/store.js";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const ORDER_NUMBER = new RegExp(`^${STORE.orderPrefix}-\\d{${STORE.orderNumberPad},}$`);
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const objectId = (label) =>
    z.string().trim().toLowerCase().regex(OBJECT_ID, `Invalid ${label} id`);

export const resendEmailQuerySchema = z.object({
    force: z.enum(["true", "false"]).optional().transform((v) => v === "true")
});

const email = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .email("Invalid email format");

const phone = z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(?:\+92|0)3\d{9}$/, "Enter a valid mobile number"))
    .transform((v) => (v.startsWith("+92") ? `0${v.slice(3)}` : v));

const startOfDay = (value) => new Date(`${value}T00:00:00${STORE.utcOffset}`);
const nextDay = (value) => new Date(startOfDay(value).getTime() + 24 * 60 * 60 * 1000);
const isValidDate = (d) => !Number.isNaN(d.getTime());

export const orderIdParamSchema = z.object({ id: objectId("order") });

export const idempotencyHeaderSchema = z.object({
    "idempotency-key": z
        .string()
        .trim()
        .uuid("Idempotency-Key must be a valid UUID")
        .optional()
});

const checkoutItemSchema = z
    .object({
        productId: objectId("product"),
        quantity: z
            .number()
            .int("Quantity must be a whole number")
            .min(1, "Quantity must be at least 1")
            .max(MAX_ITEM_QUANTITY, `Maximum ${MAX_ITEM_QUANTITY} per product`)
    })
    .strict();

export const checkoutSchema = z
    .object({
        customer: z
            .object({
                name: z.string().trim().min(2, "Name is too short").max(60, "Name is too long"),
                email,
                phone
            })
            .strict(),
        shippingAddress: z
            .object({
                address: z.string().trim().min(10, "Address must be at least 10 characters").max(300, "Address is too long"),
                city: z.string().trim().min(2, "City is too short").max(60, "City is too long"),
                notes: z.string().trim().max(500, "Notes are too long").optional()
            })
            .strict(),
        items: z
            .array(checkoutItemSchema)
            .min(1, "Order must have at least one item")
            .max(MAX_ORDER_ITEMS, `Maximum ${MAX_ORDER_ITEMS} items per order`)
            .superRefine((items, ctx) => {
                const seen = new Set();
                items.forEach((item, index) => {
                    if (seen.has(item.productId)) {
                        ctx.addIssue({
                            code: "custom",
                            message: "Duplicate product: combine quantities into one item",
                            path: [index, "productId"]
                        });
                    }
                    seen.add(item.productId);
                });
            })
    })
    .strict();

export const trackOrderSchema = z
    .object({
        orderNumber: z
            .string()
            .trim()
            .toUpperCase()
            .regex(ORDER_NUMBER, "Invalid order number"),
        email
    })
    .strict();

const dateOnly = z
    .string()
    .regex(DATE_ONLY, "Date must be YYYY-MM-DD");

export const adminOrderListQuerySchema = z
    .object({
        status: z.enum(ORDER_STATUSES).optional(),
        from: dateOnly
            .transform(startOfDay)
            .refine(isValidDate, "Invalid from date")
            .optional(),
        to: dateOnly
            .transform(nextDay)
            .refine(isValidDate, "Invalid to date")
            .optional(),
        search: z
            .string()
            .trim()
            .max(30, "Search text is too long")
            .regex(/^[A-Za-z0-9+\- ]*$/, "Search contains invalid characters")
            .optional()
            .transform((v) => v || undefined),
        page: z.coerce.number().int().min(1).max(1000).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(20)
    })
    .refine((q) => !q.from || !q.to || q.from < q.to, {
        message: "from date cannot be after to date",
        path: ["from"]
    });

const NEXT_STATUSES = ORDER_STATUSES.filter((s) => s !== "pending");

export const updateOrderStatusSchema = z
    .object({
        status: z.enum(NEXT_STATUSES),
        note: z.string().trim().max(300, "Note is too long").optional()
    })
    .strict();