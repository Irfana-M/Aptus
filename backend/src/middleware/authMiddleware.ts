import type { Request, Response, NextFunction } from "express";
import  jwt  from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";

declare module "express-serve-static-core" {
    interface Request {
        user?: { id: string; role: "admin" | "mentor" | "student" };
    }
}

interface CustomJwtPayload extends JwtPayload {
    id: string;
    role: "admin" | "mentor" | "student";
}


export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    console.log(req);
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if( !authHeader || !authHeader.startsWith("Bearer "))
        return res.status(401).json({ success: false, message: "Unauthorized"});

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as unknown as CustomJwtPayload;
        
        if(!decoded.id || !decoded.role) {
            return res.status(401).json({success: false, message: "Invalid token payload"});
        }


        req.user = { id: decoded.id, role: decoded.role };
        next();

    } catch (error) {
        return res.status(401).json({ success:false, message: "Invalid or expired token" });
    }
};