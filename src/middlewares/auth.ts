import jwt from "jsonwebtoken";
import { Response } from "express";

export const authMiddleware = (req: any, res: Response, next: any) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    req.ajiltan = jwt.verify(token || "", process.env.APP_SECRET || "tokenUusgekhZevTabs2022");
    next();
  } catch { res.status(401).json({ success: false, message: "Unauthorized" }); }
};
