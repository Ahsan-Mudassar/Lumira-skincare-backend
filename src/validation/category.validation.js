import { z } from "zod"

const createCategorySchema = z.object({
    name: z.string().trim().min(1).max(50),
    image: z.string().url()
})

const updateCategorySchema = z.object({
    name: z.string().trim().min(1).max(50),
    image: z.string().url().optional()
})

export { createCategorySchema, updateCategorySchema }