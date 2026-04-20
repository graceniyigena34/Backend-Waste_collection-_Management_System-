import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "Admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
};

export const authorizeDriver = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "Collector" && req.user?.role !== "Admin") {
    res.status(403).json({ message: "Driver or Admin access required" });
    return;
  }
  next();
};
