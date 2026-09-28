import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {  errorHandler, notFound } from "./middlewares/errorHandler.middleware.js";
dotenv.config();

const app = express()

app.use(cors());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));


app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ message: "API is healthy" });
});



app.use(notFound);
app.use(errorHandler);

export default app;