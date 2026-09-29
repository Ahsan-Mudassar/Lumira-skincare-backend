import mongoose from "mongoose"

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone:{
        type: String,
        required: true,
    },
    role:{
        type: String,
        enum: ["customer"],
        default: "customer"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    address: {
        type: String,
        required: true,
        minlength:[10, "Address must be at least 10 characters long"],
    }
}, {
    timestamps: true
});

export const Customer = mongoose.model("Customer", customerSchema);