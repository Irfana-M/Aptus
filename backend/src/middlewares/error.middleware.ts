import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (
  err: Error & { code?: number; name?: string; keyValue?: Record<string, unknown> },
  req,
  res,
  
  next
) => {
  console.error('🚨 ERROR HANDLER CALLED');
  console.error('🚨 Error:', err);
  console.error('🚨 Error message:', err.message);
  console.error('🚨 Error stack:', err.stack);
  
  let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";

  if (err instanceof ZodError) {
    statusCode = HttpStatusCode.BAD_REQUEST;
    message = "Validation failed";

    const validationErrors = err.issues.map((error) => ({
      field: error.path.join("."),
      message: error.message,
      code: error.code,
    }));

    logger.warn(
      `Validation Error - ${req.method} ${req.originalUrl} - ${JSON.stringify(
        validationErrors
      )}`
    );

    return res.status(statusCode).json({
      success: false,
      message,
      errors: validationErrors,
      errorType: "VALIDATION_ERROR",
    });
  }

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.code === 11000) {
    statusCode = HttpStatusCode.CONFLICT;
    message = "Duplicate entry found";
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field} already exists`;
  } else if (err.name === "CastError") {
    statusCode = HttpStatusCode.BAD_REQUEST;
    message = "Invalid ID format";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    message = "Token expired";
  }

  logger.error(
    `${req.method} ${req.originalUrl} - ${statusCode} - ${message}`,
    {
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      body: req.body,
      params: req.params,
      query: req.query,
    }
  );

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
