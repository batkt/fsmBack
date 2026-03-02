import jwt from "jsonwebtoken";
import { Response } from "express";
import { config } from "../config";

export const authMiddleware = (req: any, res: Response, next: any) => {
  // Extract token from Authorization header: "Bearer <token>" or just "<token>"
  const authHeader = req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") 
    ? authHeader.split(" ")[1] 
    : authHeader;
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Токен олдсонгүй" });
  }

  try {
    // Use the same APP_SECRET as tureesBack for token compatibility
    const decoded = jwt.verify(token, config.APP_SECRET) as any;
    req.ajiltan = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Зөвшөөрөлгүй хандалт (Буруу токен)" });
  }
};
