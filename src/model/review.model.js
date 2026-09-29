import mongoose from "mongoose"

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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

export const Review = mongoose.model("Review", reviewSchema)