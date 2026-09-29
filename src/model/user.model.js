import mongoose from "mongoose"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ["admin"],
        default: "admin"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

userSchema.pre("save", async function () {
    userSchema.pre("save", async function () {
        if (!this.isModified("password")) return;
        this.password = await bcrypt.hash(this.password, 10);
    });
});

userSchema.methods.comparePassword = async function (adminPassword) {
    return await bcrypt.compare(adminPassword, this.password);
}

export const User = mongoose.model("User", userSchema)