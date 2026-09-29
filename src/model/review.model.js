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
        max: 5,
        validate:{
            validator:Number.isInteger,
            message:"Rating must be an integer"
        }
    },
    comment: {
        type: String,
        required: true,
        trim:true,
        minlength:10,
        maxlength:1000
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }
}, { timestamps: true })

reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema)