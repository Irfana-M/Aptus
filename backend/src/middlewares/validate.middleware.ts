import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { HttpStatusCode } from '../constants/httpStatus';

export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Better formatted errors
        const formattedErrors = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }));

        const errorMessage = formattedErrors
          .map(err => `${err.field}: ${err.message}`)
          .join('; ');

        next(new AppError(errorMessage, HttpStatusCode.BAD_REQUEST));
      } else {
        next(new AppError('Validation failed', HttpStatusCode.BAD_REQUEST));
      }
    }
  };
};

import mongoose from 'mongoose';

export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      next(new AppError(`Invalid ${paramName}: Must be a valid MongoDB ObjectId`, HttpStatusCode.BAD_REQUEST));
      return;
    }
    next();
  };
};