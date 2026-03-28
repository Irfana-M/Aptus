import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { HttpStatusCode } from '../constants/httpStatus.js';

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