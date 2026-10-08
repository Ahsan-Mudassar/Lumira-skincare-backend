import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: "Rating must be a whole number"
        }
    },
    title: {
        type: String,
        trim: true,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 1000
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    }
},
    { timestamps: true }
);

reviewSchema.index({ product: 1, customer: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ isApproved: 1, createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);