import jwt from "jsonwebtoken";
import { Response } from "express";
import { config } from "../config";
import { irtsFsmKholboltBelden } from "../utils/irtsFsmBaaz";
const { db }: any = require("zevbackv2");


export const authMiddleware = async (req: any, res: Response, next: any) => {
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

  // turees/FSM токен эсвэл irtsWeb (irtsBack)-ийн токен аль алиныг хүлээн авна.
  let decoded: any = null;
  try {
    decoded = jwt.verify(token, config.APP_SECRET) as any;
  } catch (err) {
    try {
      decoded = jwt.verify(token, config.IRTS_APP_SECRET) as any;
      decoded.systemiinTurul = "irts";
    } catch (err2) {
      decoded = null;
    }
  }
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Зөвшөөрөлгүй хандалт (Буруу токен)" });
  }

  req.ajiltan = decoded;

  if (decoded.baiguullagiinId) {
    const orgIdStr = decoded.baiguullagiinId.toString();
    let tenantConn = Array.isArray(db.kholboltuud)
      ? db.kholboltuud.find((c: any) => c.orgIds && c.orgIds.has(orgIdStr))
      : null;

    // irtsWeb-ийн байгууллага анх ирэхэд өөрийн шинэ FSM баазыг үүсгэнэ
    if (!tenantConn && decoded.systemiinTurul === "irts") {
      tenantConn = await irtsFsmKholboltBelden(orgIdStr);
    }

    if (tenantConn) {
      req.tukhainBaaziinKholbolt = tenantConn;
    } else {
      console.warn(`[Auth] No FSM connection found for org: ${orgIdStr}`);
    }
  }

  next();
};
