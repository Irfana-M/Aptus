import type { Request, Response, NextFunction } from "express";

export const requireRole = (role: "admin" | "mentor" | "student") => {
    return (req: Request, res: Response, next: NextFunction) => {
         if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (req.user.role !== role) return res.status(403).json({ success: false, message: "Forbidden" });
    next();
  };
    
};