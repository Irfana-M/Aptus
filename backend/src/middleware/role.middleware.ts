import type { Request, Response, NextFunction } from "express";

export const requireRole = (roles: ("admin" | "mentor" | "student") | ("admin" | "mentor" | "student")[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
         if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
         
         const allowedRoles = Array.isArray(roles) ? roles : [roles];
         
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ success: false, message: "Forbidden" });
    next();
  };
    
};