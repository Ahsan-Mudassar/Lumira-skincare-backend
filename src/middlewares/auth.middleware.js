import jwt from "jsonwebtoken";
import { User } from "../model/user.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"

const protect = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new ApiError(401, "Unauthorized request: No token provided");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new ApiError(401, "Session Expired: Invalid token", err.message);
    }

    const user = await User.findById(decoded.id).select("name email role isActive tokenVersion");
    if (!user || !user.isActive || user.tokenVersion !== decoded.tv) {
        throw new ApiError(401, "Session expired;Please login again...");
    }
    req.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
    }
    next();
})

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Unauthorized: User not authenticated"));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, "Forbidden: Insufficient permissions"));
        }
        next();
    };
};

const adminOnly = authorize("admin");

export { protect, authorize, adminOnly };