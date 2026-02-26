import { Response } from "express";
import { baiguullagaBurtgekh, baiguullagaJagsaalt } from "../services/dbService";

export const createBaiguullaga = async (req: any, res: Response, next: any) => {
  try {
    const result = await baiguullagaBurtgekh(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
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
