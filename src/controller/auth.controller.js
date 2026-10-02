import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../utils/token.js";

const Login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email.trim() || !password.trim()) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const token = jwt.sign(
        { id: user._id.toString(), tv: user.tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });
    const LoginUser = await User.findById(user._id).select("-password");

    res
        .status(200)
        .cookie("token", token, cookieOptions)
        .json(
            new ApiResponse(200, { token, user: LoginUser }, "Login successful")
        )
})

const Logout = asyncHandler(async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await User.findByIdAndUpdate(decoded.id, { $inc: { tokenVersion: 1 } });
    }

    res
        .status(200)
        .clearCookie("token", cookieOptions)
        .json(
            new ApiResponse(200, null, "Logout successful")
        );
})

const currentUser = asyncHandler(async (req, res) => {
    res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
        );
});

export { Login, Logout, currentUser };