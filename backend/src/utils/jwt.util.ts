import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "supersecretrefresh";

export interface CustomJwtPayload extends JwtPayload {
  id: string;
  role: "admin" | "mentor" | "student";
  email?: string | undefined;
}

export const generateAccessToken = (payload: CustomJwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

export const generateRefreshToken = (payload: CustomJwtPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): CustomJwtPayload => {
  return jwt.verify(token, JWT_SECRET) as CustomJwtPayload;
};

export const verifyRefreshToken = (token: string): CustomJwtPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as CustomJwtPayload;
};
