import { Document } from "mongoose";

export const turulJagsaalt = async (query: any, fsmConn: any) => {
  const TurulModel = require("../models/fsmTurul")(fsmConn);
  return await TurulModel.find(query).sort({ createdAt: -1 });
};

export const turulUusgekh = async (data: any, fsmConn: any) => {
  const TurulModel = require("../models/fsmTurul")(fsmConn);
  const turul = new TurulModel(data);
  return await turul.save();
};

export const turulZasakh = async (id: string, data: any, fsmConn: any) => {
  const TurulModel = require("../models/fsmTurul")(fsmConn);
  return await TurulModel.findByIdAndUpdate(id, data, { new: true });
};

export const turulUstgakh = async (id: string, fsmConn: any) => {
  const TurulModel = require("../models/fsmTurul")(fsmConn);
  return await TurulModel.findByIdAndDelete(id);
};
