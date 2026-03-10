import { Response } from "express";
import {
  baraaJagsaalt,
  baraaUusgekh,
  baraaZasakh,
  baraaUstgakh,
  baraaNegAvakh,
  baraaAshiglalatStats,
} from "../services/baraaService";

export const getBaraas = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {};
    const bid = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    if (bid) query.baiguullagiinId = bid;

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
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const data = {
      ...req.body,
      ...(bid && { baiguullagiinId: bid })
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
export const getBaraaUsageStats = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    const barilgiinId = req.query.barilgiinId;
    const { startDate, endDate } = req.query;
    
    if (!bid || !barilgiinId) {
      return res.status(400).json({ success: false, message: "baiguullagiinId болон barilgiinId шаардлагатай" });
    }

    const sDate = startDate ? new Date(startDate as string) : undefined;
    const eDate = endDate ? new Date(endDate as string) : undefined;

    const stats = await baraaAshiglalatStats(bid, barilgiinId as string, sDate, eDate);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
