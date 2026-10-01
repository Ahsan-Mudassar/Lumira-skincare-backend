import { z } from "zod";

const SKIN_TYPES = ['dry', 'oily', 'normal', 'combination', 'sensitive', 'all']

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MAX_PRICE = 1_000_000;
const MAX_STOCK = 100_000;
const MAX_STOCK_ADJUSTMENT = 10_000;
const MAX_IMAGES = 8;
const MAX_INGREDIENTS = 30;
const SORT_OPTIONS = ["newest", "price_asc", "price_desc", "name"];

const objectId = (label) => z.string().regex(OBJECT_ID, `Invalid ${label} id`);

const slug = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Slug is required")
    .max(150, "Slug is too long")
    .regex(SLUG, "Invalid slug format");

const csvEnum = (values) =>
    z
        .string()
        .trim()
        .toLowerCase()
        .transform((v) => [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))])
        .pipe(
            z
                .array(z.enum(values))
                .max(values.length)
                .transform((arr) => (arr.length ? arr : undefined))
        );

const imageUrl = z
    .string()
    .trim()
    .url("Each image must be a valid URL")
    .refine((u) => u.startsWith("https://"), "Image URL must use https");

const stockField = z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(MAX_STOCK, "Stock is too high");

const priceField = z
    .number()
    .int("Must be a whole number")
    .positive("Must be greater than 0")
    .max(MAX_PRICE, "Value is too high");

const discountRule = (d) =>
    d.discountPrice == null || d.price === undefined || d.discountPrice < d.price;
const discountRuleError = {
    message: "discountPrice must be less than price",
    path: ["discountPrice"]
};
export const slugParamSchema = z.object({ slug });

export const idParamSchema = z.object({ id: objectId("product") });

export const listProductsQuerySchema = z
    .object({
        category: slug.optional(),
        skinType: csvEnum(SKIN_TYPES).optional(),
        minPrice: z.coerce.number().min(0).max(MAX_PRICE).optional(),
        maxPrice: z.coerce.number().min(0).max(MAX_PRICE).optional(),
        search: z
            .string()
            .trim()
            .max(50, "Search text is too long")
            .optional()
            .transform((v) => v || undefined),
        sort: z.enum(SORT_OPTIONS).default("newest"),
        page: z.coerce.number().int().min(1).max(1000).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(12)
    })
    .refine(
        (q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice,
        { message: "minPrice cannot be greater than maxPrice", path: ["minPrice"] }
    );

export const featuredQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(12).default(8)
});

const productFields = {
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120, "Name is too long"),
    description: z
        .string()
        .trim()
        .min(10, "Description must be at least 10 characters")
        .max(5000, "Description is too long"),
    price: priceField,
    discountPrice: priceField,
    sku: z.string().trim().min(2, "SKU is too short").max(40, "SKU is too long"),
    category: objectId("category"),
    skinType: z.array(z.enum(SKIN_TYPES)).min(1, "Select at least one skin type").max(SKIN_TYPES.length),
    ingredients: z.array(z.string().trim().min(1).max(100)).max(MAX_INGREDIENTS, "Too many ingredients"),
    images: z
        .array(imageUrl)
        .min(1, "At least one image is required")
        .max(MAX_IMAGES, `Maximum ${MAX_IMAGES} images`),
    isFeatured: z.boolean(),
    isActive: z.boolean()
};

export const createProductSchema = z
    .object({
        name: productFields.name,
        description: productFields.description,
        price: productFields.price,
        discountPrice: productFields.discountPrice.optional(),
        sku: productFields.sku,
        category: productFields.category,
        skinType: productFields.skinType,
        ingredients: productFields.ingredients.default([]),
        images: productFields.images,
        stock: stockField.default(0),
        isFeatured: productFields.isFeatured.default(false)
    })
    .strict()
    .refine(discountRule, discountRuleError);

export const updateProductSchema = z
    .object({
        name: productFields.name,
        description: productFields.description,
        price: productFields.price,
        discountPrice: productFields.discountPrice.nullable(),
        sku: productFields.sku,
        category: productFields.category,
        skinType: productFields.skinType,
        ingredients: productFields.ingredients,
        images: productFields.images,
        isFeatured: productFields.isFeatured,
        isActive: productFields.isActive
    })
    .partial()
    .strict()
    .refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" })
    .refine(discountRule, discountRuleError);

export const updateStockSchema = z
    .object({
        stock: stockField.optional(),
        adjustBy: z
            .number()
            .int("adjustBy must be a whole number")
            .min(-MAX_STOCK_ADJUSTMENT)
            .max(MAX_STOCK_ADJUSTMENT)
            .optional()
    })
    .strict()
    .refine((d) => d.stock !== undefined || d.adjustBy !== undefined, {
        message: "Either stock or adjustBy is required"
    })
    .refine((d) => !(d.stock !== undefined && d.adjustBy !== undefined), {
        message: "Send either stock or adjustBy, not both"
    })
    .refine((d) => d.adjustBy !== 0, { message: "adjustBy cannot be 0", path: ["adjustBy"] });