import { Response } from "express";
import {
  turulJagsaalt,
  turulUusgekh,
  turulZasakh,
  turulUstgakh,
  TurulAldaa,
} from "../services/fsmTurulService";
import { getFsmConnFromReq } from "../utils/fsmConn";

// Үйлчилгээний давхаргын 400/409 алдааг хариу болгоно, бусдыг нь next рүү.
function aldaaKhariulakh(err: any, res: Response, next: any) {
  if (err instanceof TurulAldaa) {
    return res
      .status(err.status)
      .json({ success: false, message: err.message, ...err.nemelt });
  }
  return next(err);
}

export const getTuruls = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {};
    const bid = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    if (bid) query.baiguullagiinId = bid;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;

    const turuls = await turulJagsaalt(query, getFsmConnFromReq(req), {
      baraaToo: req.query.baraaToo === "true",
    });
    res.json({ success: true, data: turuls });
  } catch (err) {
    next(err);
  }
};

export const createTurul = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const data = {
      ...req.body,
      ...(bid && { baiguullagiinId: bid })
    };
    const turul = await turulUusgekh(data, getFsmConnFromReq(req));
    res.status(201).json({ success: true, data: turul });
  } catch (err) {
    aldaaKhariulakh(err, res, next);
  }
};

export const updateTurul = async (req: any, res: Response, next: any) => {
  try {
    const turul = await turulZasakh(req.params.id, req.body, getFsmConnFromReq(req));
    if (!turul) return res.status(404).json({ success: false, message: "Олдсонгүй" });

    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom("broadcast", "baraa_updated", { angilal: true });

    res.json({ success: true, data: turul });
  } catch (err) {
    aldaaKhariulakh(err, res, next);
  }
};

// DELETE /fsm-turuls/:id?shiljuulekh=<ангиллын нэр>
export const deleteTurul = async (req: any, res: Response, next: any) => {
  try {
    const turul = await turulUstgakh(
      req.params.id,
      getFsmConnFromReq(req),
      req.query.shiljuulekh,
    );
    if (!turul) return res.status(404).json({ success: false, message: "Олдсонгүй" });

    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom("broadcast", "baraa_updated", { angilal: true });

    res.json({ success: true, message: "Амжилттай устгагдлаа" });
  } catch (err) {
    aldaaKhariulakh(err, res, next);
  }
};
