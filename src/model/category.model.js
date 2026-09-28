import mongoose from "mongoose"

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            unique: true,
            trim: true,
            maxlength: [50, "Category name must be less than 50 characters"]
        },
        slug: {
            type: String,
            required: [true, "Category slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens only"],
        },
        image: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
)

const Category = mongoose.model("Category", categorySchema);

export default Category;