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
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (value) => {
                try {
                    return new URL(value).protocol === "https:";
                } catch {
                    return false;
                }
            },
            message: "Order item image must be a valid HTTPS URL"
        }
    },
    price: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: "price must be an whole number"
        }
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        validate: {
            validator: Number.isInteger,
            message: "Quantity must be an whole number"
        }
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
    },
    note: {
        type: String,
        trim: true,
        maxlength: 60
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
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
            lowercase: true,
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
        validate: [
            {
                validator: (v) => v.length > 0,
                message: "Order must have at least one item"
            },
            {
                validator: (v) => v.length <= 20,
                message: "Order cannot have more than 20 items"
            },
        ]
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
    shippingFee: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
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
    },
    emailSentAt: {
        type: Date
    },
    emailError: {
        type: String,
        trim: true,
        maxlength: 300
    },
}, {
    timestamps: true
});

orderSchema.pre("validate", function () {
    this.items.forEach(i => { i.lineTotal = i.price * i.quantity });
    this.subtotal = this.items.reduce((s, i) => s + i.lineTotal, 0);
    this.total = this.subtotal + this.shippingFee;
});

orderSchema.index({ status: 1 });
orderSchema.index({ "items.product": 1 })
orderSchema.index({ customer: 1, createdAt: -1 })
orderSchema.index({ "customerSnapshot.phone": 1 })
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);