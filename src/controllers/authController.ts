import { Response } from "express";
import { loginWithTurees, getAjiltanDetails } from "../services/authService";

export const login = async (req: any, res: Response, next: any) => {
  try {
    const { nevtrekhNer, nuutsUg } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
    const tsag = new Date().toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" });

    console.log(`[LOGIN] ${tsag} | IP: ${ip} | Хэрэглэгч: ${nevtrekhNer}`);

    const result = await loginWithTurees(nevtrekhNer, nuutsUg);

    if (!result) {
      console.log(`[LOGIN] ❌ Амжилтгүй | ${nevtrekhNer} | IP: ${ip}`);
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log(`[LOGIN] ✅ Амжилттай | ${nevtrekhNer} | ID: ${result.result?._id} | IP: ${ip}`);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getMe = async (req: any, res: Response, next: any) => {
  try {
    const details = await getAjiltanDetails(req.ajiltan.id, req.ajiltan.baiguullagiinId);
    res.json({ success: true, ...details });
  } catch (err) { next(err); }
};
