import { getConn } from "../utils/db";
const getTaskTuukhModel = require("../models/taskTuukh");

export const taskTuukhJagsaalt = async (query: any) => {
  return await getTaskTuukhModel(getConn()).find(query).sort({ createdAt: -1 }).lean();
};

export const taskTuukhUusgekh = async (data: any) => {
  return await getTaskTuukhModel(getConn()).create(data);
};

export const taskTuukhNegAvakh = async (id: string) => {
  return await getTaskTuukhModel(getConn()).findById(id).lean();
};
