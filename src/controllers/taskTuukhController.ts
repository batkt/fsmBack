import { Response } from "express";
import { taskTuukhJagsaalt, taskTuukhNegAvakh } from "../services/taskTuukhService";
import { getFsmConnFromReq } from "../utils/fsmConn";

export const getTaskTuukhs = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {
      baiguullagiinId: req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId,
    };

    if (req.query.projectId) query.projectId = req.query.projectId;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;

    const tuukhs = await taskTuukhJagsaalt(query, getFsmConnFromReq(req));
    res.json({ success: true, data: tuukhs });
  } catch (err) {
    next(err);
  }
};

export const getTaskTuukh = async (req: any, res: Response, next: any) => {
  try {
    const tuukh = await taskTuukhNegAvakh(req.params.id, getFsmConnFromReq(req));
    if (!tuukh) return res.status(404).json({ success: false, message: "Түүх олдсонгүй" });
    res.json({ success: true, data: tuukh });
  } catch (err) {
    next(err);
  }
};
