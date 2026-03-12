import jwt from "jsonwebtoken";
import { Response } from "express";
import { config } from "../config";

export const authMiddleware = (req: any, res: Response, next: any) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const authHeader = req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") 
    ? authHeader.split(" ")[1] 
    : authHeader;
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Токен олдсонгүй" });
  }

  try {
    const decoded = jwt.verify(token, config.APP_SECRET) as any;
    req.ajiltan = decoded;
    
    // Multi-tenancy: Attach the organization-specific database connection
    const { db }: any = require("zevbackv2");
    if (decoded.baiguullagiinId && db.kholboltuud && db.kholboltuud[decoded.baiguullagiinId]) {
      const tenantConn = db.kholboltuud[decoded.baiguullagiinId];
      req.tukhainBaaziinKholbolt = tenantConn;
      
      // Ensure it's available in body for controllers that expect it there
      if (req.body) {
        req.body.tukhainBaaziinKholbolt = tenantConn;
      }
    }
    
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Зөвшөөрөлгүй хандалт (Буруу токен)" });
  }
};
