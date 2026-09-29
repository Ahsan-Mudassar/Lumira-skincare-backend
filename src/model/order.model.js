import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: [String],
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    lineTotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        required: true
    },
    changedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false })

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    customerSnapshot: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        }
    },
    shippingAddress: {
        address: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, "Notes must be less than 500 characters"]
        }
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function (value) {
                return value.length > 0;
            },
            message: "Order must have at least one item"
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ["COD"],
        default: "COD",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        default: "pending",
        required: true
    },
    statusHistory: {
        type: [statusHistorySchema],
        default: []
    },
    emailSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "item.product": 1 })

export const Order = mongoose.model("Order", orderSchema);