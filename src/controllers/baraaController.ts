import { Response } from "express";
import {
  baraaJagsaalt,
  baraaUusgekh,
  baraaZasakh,
  baraaUstgakh,
  baraaNegAvakh,
  baraaAshiglalatStats,
} from "../services/baraaService";
import { getFsmConnFromReq } from "../utils/fsmConn";

export const getBaraas = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {};
    const bid = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    if (bid) query.baiguullagiinId = bid;

    if (req.query.turul) query.turul = req.query.turul;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;
    if (req.query.idevhtei !== undefined) query.idevhtei = req.query.idevhtei === "true";

    const baraas = await baraaJagsaalt(query, getFsmConnFromReq(req));
    res.json({ success: true, data: baraas });
  } catch (err) {
    next(err);
  }
};

export const getBaraa = async (req: any, res: Response, next: any) => {
  try {
    const baraa = await baraaNegAvakh(req.params.id, getFsmConnFromReq(req));
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
    const baraa = await baraaUusgekh(data, getFsmConnFromReq(req));
    
    // Emit socket event for real-time refresh
    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom("broadcast", "baraa_created", baraa);

    res.status(201).json({ success: true, data: baraa });
  } catch (err) {
    next(err);
  }
};

export const updateBaraa = async (req: any, res: Response, next: any) => {
  try {
    const baraa = await baraaZasakh(req.params.id, req.body, getFsmConnFromReq(req));
    if (!baraa) return res.status(404).json({ success: false, message: "Бараа олдсонгүй" });

    // Emit socket event for real-time refresh
    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom("broadcast", "baraa_updated", baraa);

    res.json({ success: true, data: baraa });
  } catch (err) {
    next(err);
  }
};

export const deleteBaraa = async (req: any, res: Response, next: any) => {
  try {
    const baraa = await baraaUstgakh(req.params.id, getFsmConnFromReq(req));
    if (!baraa) return res.status(404).json({ success: false, message: "Бараа олдсонгүй" });
    
    // Emit socket event to refresh frontend charts and tables
    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom("broadcast", "baraa_deleted", { id: req.params.id });
    // Also trigger task updates as usage stats depend on baraa presence
    emitToRoom("broadcast", "task_updated", {});

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

    const stats = await baraaAshiglalatStats(bid, barilgiinId as string, sDate, eDate, getFsmConnFromReq(req));
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
