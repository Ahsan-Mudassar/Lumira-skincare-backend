import { Router } from "express";
import { Login, Logout, currentUser } from "../controller/auth.controller.js";
import { LoginRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { loginSchema } from "../validation/user.validation.js";
import { validate } from "../middlewares/validation.middleware.js";

const router = Router();

router.post("/login", LoginRateLimiter, validate(loginSchema), Login);

router.post("/logout", Logout);
router.get("/me", protect, authorize('admin'), currentUser);

export default router;