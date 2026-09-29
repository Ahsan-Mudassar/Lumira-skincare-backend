// @ts-nocheck
import { ApiError } from "../utils/ApiError.js";

const notFound = (req, res, next) => {
  return next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const duplicateErrorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const value = err.keyValue[field];
    const message = `Duplicate value for field '${field}': '${value}'`;

    return next(new ApiError(409, message));
  }
}

export { notFound, errorHandler, duplicateErrorHandler };