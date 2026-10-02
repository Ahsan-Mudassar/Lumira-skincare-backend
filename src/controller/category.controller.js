import { Category } from "../model/category.model.js"
import { Product } from "../model/product.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"

const getAllCategories = asyncHandler(async (req, res) => {

    const categories = await Category.find().sort({ name: 1 }).lean()

    const counts = await Product.aggregate([
        {
            $match: {
                isActive: true
            }
        },
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        }
    ])

    const countMap = new Map(
        counts.map((c) => [String(c._id), c.count])
    );

    const data = categories.map((cat) => ({
        ...cat,
        productCount: countMap.get(String(cat._id)) || 0,
    }))

    res
        .status(200)
        .json(new ApiResponse(200, { count: data.length, data }, "All categories fetch successfully"))
})

const getCategoryBySlug = asyncHandler(async (req, res) => {
    const slug = req.params.slug.trim().toLowerCase();

    const category = await Category.findOne({ slug }).lean();

    if (!category) throw new ApiError(404, "Category not found")

    res
        .status(200)
        .json(new ApiResponse(200, category, "Category fetch by slug successfully"))
})

const createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body

    if (!name || !name.trim()) throw new ApiError(400, "Name is required")

    const category = await Category.create(
        {
            name: name.trim()
        }
    )

    res
        .status(201)
        .json(new ApiResponse(201, category, "New Category was created"))
})

const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid category ID")
    }

    const category = await Category.findOne({ _id: id });
    if (!category) throw new ApiError(404, "Category not found")

    const { name } = req.body;

    if (name !== undefined) {
        if (!name.trim()) throw new ApiError(400, "Category name is required")
        category.name = name.trim();
    }

    await category.save();

    res
        .status(200)
        .json(
            new ApiResponse(200, category, "Category update successfully")
        )
})

const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid category ID")
    }

    const category = await Category.findOne({ _id: id });

    if (!category) throw new ApiError(404, "Category not found")
    const hasProducts = await Product.exists({ category: id })

    if (hasProducts) {
        throw new ApiError(409, "Category has products first move or remove them.")
    }

    await category.deleteOne();

    res
        .status(200)
        .json(new ApiResponse(200, {}, "Category field deleted successfully"))
})

export {
    getAllCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory
}