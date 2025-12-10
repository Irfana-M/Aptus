import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { HttpStatusCode } from '../constants/httpStatus';


export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (isZodError(error)) {
        const errorMessage = (error as any).errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        
        next(new AppError(errorMessage, HttpStatusCode.BAD_REQUEST));
      } else {
        next(new AppError('Validation failed', HttpStatusCode.BAD_REQUEST));
      }
    }
  };
};


export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as unknown as Request['query'];
      next();
    } catch (error) {
      if (isZodError(error)) {
        const errorMessage = (error as any).errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        
        next(new AppError(errorMessage, HttpStatusCode.BAD_REQUEST));
      } else {
        next(new AppError('Query validation failed', HttpStatusCode.BAD_REQUEST));
      }
    }
  };
};


export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as unknown as Request['params'];
      next();
    } catch (error) {
      if (isZodError(error)) {
        const errorMessage = (error as any).errors
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        
        next(new AppError(errorMessage, HttpStatusCode.BAD_REQUEST));
      } else {
        next(new AppError('Params validation failed', HttpStatusCode.BAD_REQUEST));
      }
    }
  };
};


function isZodError(error: unknown): error is ZodError {
  return (error as any)?.errors !== undefined && Array.isArray((error as any).errors);
}
