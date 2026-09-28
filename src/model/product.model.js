import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            maxlength: [100, "Product name must be less than 100 characters"]
        },
        slug: {
            type: String,
            required: [true, "Product slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and hyphens only"]
        },
        description: {
            type: String,
            trim:true,
            required: [true, "Product description is required"],
            maxlength: [1000, "Product description must be less than 1000 characters"]
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, "Product category is required"]
        },
        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Product price must be greater than or equal to 0"],
            validate: {
                validator: Number.isInteger,
                message: "Product price must be greater than or equal to 0"
            },
        },
        discountPrice: {
            type: Number,
            min: [0, "Product discount price must be greater than or equal to 0"],
            validate: {
                validator: function (value) {
                    return value == null || value < this.price;
                },
                message: "Product discount price must be less than the regular price"
            }
        },
        costPrice: {
            type: Number,
            required: [true, "Product cost price is required"],
            select: false
        },
        images: {
            type: [String],
            required: [true, "Product images are required"],
            validate: {
                validator: (arr) => arr.length > 0,
                message: "Product images must be a valid URL ending with .jpg or .png"
            }
        },
        ingredients: {
            type: [String],
        },
        skinType: {
            type: [String],
            enum: {
                values: ['dry', 'oily', 'normal', 'combination', 'sensitive', 'all'],
                message: "Skin type must be either 'dry', 'oily', 'normal', 'combination','sensitive' or 'all'"
            }
        },
        size: {
            type: String,
            required: [true, "Product size is required"],
        },
        stock: {
            type: Number,
            required: [true, "Product stock is required"],
            min: [0, "Product stock must be greater than or equal to 0"],
            default: 0
        },
        sku: {
            type: String,
            required: [true, "Product SKU is required"],
            unique: true,
            uppercase: true,
            trim: true,
            maxlength: [50, "Product SKU must be less than 50 characters"]
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        },
        soldCount: {
            type: Number,
            default: 0
        },
        viewCount: {
            type: Number,
            default: 0
        }
    }, { timestamps: true }
)

const Product = mongoose.model('Product', productSchema);
export default Product;