import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema, type ZodIssue } from 'zod';
import { AppError } from '../utils/AppError';
import { HttpStatusCode } from '../constants/httpStatus';


export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((err: ZodIssue) => `${err.path.join('.')}: ${err.message}`)
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
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((err: ZodIssue) => `${err.path.join('.')}: ${err.message}`)
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
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((err: ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        
        next(new AppError(errorMessage, HttpStatusCode.BAD_REQUEST));
      } else {
        next(new AppError('Params validation failed', HttpStatusCode.BAD_REQUEST));
      }
    }
  };
};



