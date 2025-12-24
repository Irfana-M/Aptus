import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; role: "admin" | "mentor" | "student" };
  }
}

interface CustomJwtPayload extends JwtPayload {
  id: string;
  role: "admin" | "mentor" | "student";
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError(
        "Unauthorized - No token provided",
        HttpStatusCode.UNAUTHORIZED
      ));
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return next(new AppError(
        "Unauthorized - No token provided",
        HttpStatusCode.UNAUTHORIZED
      ));
    }

    // ✅ FIX: Use the same JWT secret logic as tokenUtils.ts
    const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
    
    console.log('🔐 Auth Debug:', {
      tokenLength: token.length,
      envSecretExists: !!process.env.JWT_SECRET,
      usingSecret: JWT_SECRET === "supersecret" ? "Default" : "Custom"
    });

    const decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload;

    console.log('✅ Token verified:', {
      id: decoded.id,
      role: decoded.role,
      expiresIn: decoded.exp ? `${decoded.exp - Math.floor(Date.now()/1000)}s` : 'unknown'
    });

    if (!decoded.id || !decoded.role) {
      return next(new AppError(
        "Invalid token payload", 
        HttpStatusCode.UNAUTHORIZED
      ));
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Auth Error:', error.name, error.message);
      
      if (error.name === 'TokenExpiredError') {
        return next(new AppError(
          "Token has expired",
          HttpStatusCode.UNAUTHORIZED
        ));
      }
      
      if (error.name === 'JsonWebTokenError') {
        return next(new AppError(
          "Invalid token",
          HttpStatusCode.UNAUTHORIZED
        ));
      }
    } else {
      console.error('❌ Auth Error: Unknown error', error);
    }
    
    return next(new AppError(
      "Authentication failed",
      HttpStatusCode.UNAUTHORIZED
    ));
  }
};