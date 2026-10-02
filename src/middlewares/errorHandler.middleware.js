import { ApiError } from "../utils/ApiError.js";

const notFound = (req, res, next) => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
}
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    errors: err.errors || [],
    stack:process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

const duplicateErrorHandler = (err, req, res, next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const value = err.keyValue[field];
    const message = `Duplicate value for field '${field}': '${value}'`;

    return next(new ApiError(409, message));
  }

  next(err);
}

export { notFound, errorHandler, duplicateErrorHandler };