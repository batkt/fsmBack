import { Response } from "express";
import { ensureFsmConn, getFsmConnFromReq } from "../utils/fsmConn";

const getTokhirgooModel = require("../models/fsmTokhirgoo");

// Зөвхөн эдгээр талбарыг хадгална/буцаана.
const TALBARUUD = ["umnukhUdurtKhuvaariOruulakh"] as const;
const ANKHDAGCH = { umnukhUdurtKhuvaariOruulakh: false };

function tokhirgooModel(req: any) {
  return getTokhirgooModel(ensureFsmConn(getFsmConnFromReq(req)));
}

function tsevrlekh(doc: any) {
  const garalt: any = { ...ANKHDAGCH };
  TALBARUUD.forEach((k) => {
    if (doc && doc[k] !== undefined) garalt[k] = doc[k];
  });
  return garalt;
}

// GET /fsm-tokhirgoo?barilgiinId=
export const getTokhirgoo = async (req: any, res: Response, next: any) => {
  try {
    const baiguullagiinId = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    const barilgiinId = req.query.barilgiinId;
    if (!baiguullagiinId || !barilgiinId) {
      return res.status(400).json({ success: false, message: "baiguullagiinId, barilgiinId шаардлагатай" });
    }
    const doc = await tokhirgooModel(req).findOne({ baiguullagiinId, barilgiinId }).lean();
    res.json({ success: true, data: tsevrlekh(doc) });
  } catch (err) {
    next(err);
  }
};

// PUT /fsm-tokhirgoo  { barilgiinId, umnukhUdurtKhuvaariOruulakh }
export const updateTokhirgoo = async (req: any, res: Response, next: any) => {
  try {
    const baiguullagiinId = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const barilgiinId = req.body.barilgiinId;
    if (!baiguullagiinId || !barilgiinId) {
      return res.status(400).json({ success: false, message: "baiguullagiinId, barilgiinId шаардлагатай" });
    }
    const set: any = {};
    TALBARUUD.forEach((k) => {
      if (typeof req.body[k] === "boolean") set[k] = req.body[k];
    });
    const doc = await tokhirgooModel(req)
      .findOneAndUpdate(
        { baiguullagiinId, barilgiinId },
        { $set: set, $setOnInsert: { baiguullagiinId, barilgiinId } },
        { new: true, upsert: true }
      )
      .lean();

    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom("broadcast", "fsm_tokhirgoo_updated", { baiguullagiinId, barilgiinId });

    res.json({ success: true, data: tsevrlekh(doc) });
  } catch (err) {
    next(err);
  }
};
