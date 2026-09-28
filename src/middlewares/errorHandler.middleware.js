import {ApiError} from "../utils/ApiError.js";

const notFound = (req, res, next) =>{
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

export { notFound, errorHandler };