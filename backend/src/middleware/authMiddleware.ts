import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";

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
  console.log(req);
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new AppError(
      "Unauthorized - No token provided",
      HttpStatusCode.UNAUTHORIZED
    );

  const token = authHeader.split(" ")[1];

  console.log('Token:', token);
  
  if (!token) {
    console.log('No token provided - blocking request');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No token provided'
    });
  }

  try {
    const decoded = jwt.verify(
      token as string,
      process.env.JWT_SECRET!
    ) as unknown as CustomJwtPayload;

    if (!decoded.id || !decoded.role) {
      throw new AppError("Invalid token payload", HttpStatusCode.UNAUTHORIZED);
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    throw new AppError("Invalid or expired token", HttpStatusCode.UNAUTHORIZED);
  }
};


