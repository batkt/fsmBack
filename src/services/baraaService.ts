import { getConn } from "../utils/db";
const getBaraaModel = require("../models/baraa");

export const baraaJagsaalt = async (query: any) => {
  return await getBaraaModel(getConn()).find(query).sort({ createdAt: -1 }).lean();
};

export const baraaUusgekh = async (data: any) => {
  return await getBaraaModel(getConn()).create(data);
};

export const baraaZasakh = async (id: string, data: any) => {
  return await getBaraaModel(getConn()).findByIdAndUpdate(id, data, { new: true }).lean();
};

export const baraaUstgakh = async (id: string) => {
  return await getBaraaModel(getConn()).findByIdAndDelete(id);
};

export const baraaNegAvakh = async (id: string) => {
  return await getBaraaModel(getConn()).findById(id).lean();
};
