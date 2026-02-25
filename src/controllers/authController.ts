import { Response } from "express";
import { loginWithTurees, getAjiltanDetails } from "../services/authService";

export const login = async (req: any, res: Response, next: any) => {
  try {
    const { nevtrekhNer, nuutsUg } = req.body;
    const result = await loginWithTurees(nevtrekhNer, nuutsUg);
    if (!result) return res.status(401).json({ success: false, message: "Unauthorized" });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getMe = async (req: any, res: Response, next: any) => {
  try {
    const details = await getAjiltanDetails(req.ajiltan.id, req.ajiltan.baiguullagiinId);
    res.json({ success: true, ...details });
  } catch (err) { next(err); }
};
