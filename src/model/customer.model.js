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
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Enter a valid email"]
    },
    phone: {
    type: String, 
    required: true, 
    trim: true,
    match: [/^(?:\+92|0)3\d{9}$/, "Enter a valid Pakistani mobile number"]
}
}, {
    timestamps: true
});

export const Customer = mongoose.model("Customer", customerSchema);