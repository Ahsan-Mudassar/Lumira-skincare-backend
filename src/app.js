import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet"
import cookieParser from "cookie-parser"
import compression from "compression"
import morgan from "morgan"
import { rateLimiterMiddleware } from "./middlewares/rateLimiter.middleware.js"
import authRoutes from "./routes/auth.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import productsRoutes from "./routes/product.routes.js"
import { errorHandler, notFound, duplicateErrorHandler } from "./middlewares/errorHandler.middleware.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URI,
    credentials: true
}));
app.use(
    morgan(process.env.NODE_ENV === "development" ? "dev" : "combined",{
    skip:(req)=>req.originalUrl==="/api/health"}
));
app.use("/api",rateLimiterMiddleware)
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(compression());

app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true, message: "API is healthy" });
});

app.use("/api/auth",authRoutes)
app.use("/api/products",productsRoutes)
app.use("/api/categories",categoryRoutes)

app.use(notFound);
app.use(duplicateErrorHandler);
app.use(errorHandler);

export default app;