import jwt from "jsonwebtoken";
import { Response } from "express";

export const authMiddleware = (req: any, res: Response, next: any) => {
  const token = req.header("Authorization")?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Токен олдсонгүй" });
  }

  try {
    const decoded = jwt.verify(token, process.env.APP_SECRET as string);
    req.ajiltan = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Зөвшөөрөлгүй хандалт (Буруу токен)" });
  }
};
