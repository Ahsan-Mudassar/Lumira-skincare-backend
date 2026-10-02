import { Router } from "express";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";
import {
    createCategory,
    deleteCategory,
    getAllCategories,
    getCategoryBySlug,
    updateCategory
} from "../controller/category.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../validation/category.validation.js";

const router = Router()

router.get("/", getAllCategories)
router.get("/:slug", getCategoryBySlug)

router.use(protect, adminOnly)
router.post("/", validate(createCategorySchema, "query"), createCategory)
router.patch("/:id", validate(updateCategorySchema, "query"), updateCategory)
router.delete("/:id", deleteCategory)

export default router;