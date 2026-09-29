import mongoose from "mongoose"
import slugify from "slugify"

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

categorySchema.pre("validate", async function () {
    if (this.isModified("name") || !this.slug) {
        const baseSlug = slugify(this.name, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;

        while (await mongoose.models.Category.exists({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        this.slug = slug;
    }
});

const Category = mongoose.model("Category", categorySchema);

export default Category;