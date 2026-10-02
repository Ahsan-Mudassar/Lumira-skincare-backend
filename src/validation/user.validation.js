import { z } from "zod";

const loginSchema = z
    .object({
        email: z
            .string()
            .trim()
            .toLowerCase()
            .min(1, { message: "Email is required" })
            .max(100, { message: "Email must be less than 100 characters long" })
            .email({ message: "Invalid email address" }),
        password: z
            .string()
            .min(8, { message: "Password must be at least 8 characters long" })
            .max(100, { message: "Password must be less than 100 characters long" })
    }).strict();

export { loginSchema }