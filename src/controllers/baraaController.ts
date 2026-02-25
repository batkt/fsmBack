import { Response } from "express";
import {
  baraaJagsaalt,
  baraaUusgekh,
  baraaZasakh,
  baraaUstgakh,
  baraaNegAvakh,
} from "../services/baraaService";

export const getBaraas = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {
      baiguullagiinId: req.ajiltan.baiguullagiinId,
    };

    if (req.query.turul) query.turul = req.query.turul;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;
    if (req.query.idevhtei !== undefined) query.idevhtei = req.query.idevhtei === "true";

    const baraas = await baraaJagsaalt(query);
    res.json({ success: true, data: baraas });
  } catch (err) {
    next(err);
  }
};

export const getBaraa = async (req: any, res: Response, next: any) => {
  try {
    const baraa = await baraaNegAvakh(req.params.id);
    if (!baraa) return res.status(404).json({ success: false, message: "Бараа олдсонгүй" });
    res.json({ success: true, data: baraa });
  } catch (err) {
    next(err);
  }
};

export const createBaraa = async (req: any, res: Response, next: any) => {
  try {
    const data = {
      ...req.body,
      baiguullagiinId: req.ajiltan.baiguullagiinId,
    };
    const baraa = await baraaUusgekh(data);
    res.status(201).json({ success: true, data: baraa });
  } catch (err) {
    next(err);
  }
};

export const updateBaraa = async (req: any, res: Response, next: any) => {
  try {
    const baraa = await baraaZasakh(req.params.id, req.body);
    if (!baraa) return res.status(404).json({ success: false, message: "Бараа олдсонгүй" });
    res.json({ success: true, data: baraa });
  } catch (err) {
    next(err);
  }
};

export const deleteBaraa = async (req: any, res: Response, next: any) => {
  try {
    const baraa = await baraaUstgakh(req.params.id);
    if (!baraa) return res.status(404).json({ success: false, message: "Бараа олдсонгүй" });
    res.json({ success: true, message: "Бараа амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
