import jwt from "jsonwebtoken";
import { Response } from "express";
import { config } from "../config";
const { db }: any = require("zevbackv2");


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
    
    if (decoded.baiguullagiinId && db.kholboltuud) {
      const orgIdStr = decoded.baiguullagiinId.toString();
      
      // 1. Try to find in existing connections
      let tenantConn = Array.isArray(db.kholboltuud) ? db.kholboltuud.find((c: any) => 
        c.orgIds && c.orgIds.has(orgIdStr)
      ) : null;

      if (tenantConn) {
        req.tukhainBaaziinKholbolt = tenantConn;
      } else {
        // 2. If not found, it might be a newly authorized organization.
        // We could trigger a reload or just log it.
        console.warn(`[Auth] No FSM connection found for org: ${orgIdStr}`);
      }
    }
    
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Зөвшөөрөлгүй хандалт (Буруу токен)" });
  }
};
