import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const statusCode =
    err instanceof AppError ? err.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;

  logger.error(
    `${req.method} ${req.originalUrl} - ${statusCode} - ${err.message}`
  );

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};