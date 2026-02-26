import { getConn } from "../utils/db";
const getSubTaskModel = require("../models/subTask");

export const subTaskJagsaalt = async (query: any) => {
  return await getSubTaskModel(getConn()).find(query).sort({ createdAt: 1 }).lean();
};

export const subTaskUusgekh = async (data: any) => {
  return await getSubTaskModel(getConn()).create(data);
};

export const subTaskZasakh = async (id: string, data: any) => {
  return await getSubTaskModel(getConn()).findByIdAndUpdate(id, data, { new: true }).lean();
};

export const subTaskUstgakh = async (id: string) => {
  return await getSubTaskModel(getConn()).findByIdAndDelete(id);
};

export const subTaskNegAvakh = async (id: string) => {
  return await getSubTaskModel(getConn()).findById(id).lean();
};
