import { Response } from "express";
import { baiguullagaBurtgekh, baiguullagaJagsaalt } from "../services/dbService";

export const createBaiguullaga = async (req: any, res: Response, next: any) => {
  try {
    const result = await baiguullagaBurtgekh(req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    // Return error in consistent format
    const errorMessage = err.message || "Алдаа гарлаа";
    const statusCode = err.message?.includes("timeout") || err.message?.includes("холболт") ? 500 : 400;
    return res.status(statusCode).json({ success: false, message: errorMessage });
  }
};

export const getBaiguullaguud = async (req: any, res: Response, next: any) => {
  try {
    const list = await baiguullagaJagsaalt();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};
