import { getConn } from "../utils/db";
const getTaskModel = require("../models/task");

export const taskJagsaalt = async (query: any) => {
  return await getTaskModel(getConn()).find(query).sort({ createdAt: -1 }).lean();
};

export const taskUusgekh = async (data: any) => {
  return await getTaskModel(getConn()).create(data);
};

export const taskZasakh = async (id: string, data: any) => {
  return await getTaskModel(getConn()).findByIdAndUpdate(id, data, { new: true }).lean();
};

export const taskUstgakh = async (id: string) => {
  return await getTaskModel(getConn()).findByIdAndDelete(id);
};

export const taskNegAvakh = async (id: string) => {
  return await getTaskModel(getConn()).findById(id).lean();
};
