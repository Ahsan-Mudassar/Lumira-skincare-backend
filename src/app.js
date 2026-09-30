import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet"
import cookieParser from "cookie-parser"
import compression from "compression"
import rateLimit from "express-rate-limit"
import { errorHandler, notFound, duplicateErrorHandler } from "./middlewares/errorHandler.middleware.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URI,
    credentials: true
}));
app.use(
    "/api",
    rateLimit({
        windowMs: 15 * 60 * 100,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            sucess: false,
            message: "Too many request,Please try again later"
        }
    })
)
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(compression());

app.get("/api/health", (req, res) => {
    res.status(200).json({ sucess: true, message: "API is healthy" });
});

// routes handle here

app.use(notFound);
app.use(duplicateErrorHandler);
app.use(errorHandler);

export default app;