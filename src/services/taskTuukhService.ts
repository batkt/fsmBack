import { getConn } from "../utils/db";
const getTaskTuukhModel = require("../models/taskTuukh");

export const taskTuukhJagsaalt = async (query: any, conn?: any) => {
  const baseConn = conn || getConn();
  return await getTaskTuukhModel(baseConn, true).find(query).sort({ createdAt: -1 }).lean();
};

export const taskTuukhUusgekh = async (data: any, conn?: any) => {
  const baseConn = conn || getConn();
  return await getTaskTuukhModel(baseConn, true).create(data);
};

export const taskTuukhNegAvakh = async (id: string, conn?: any) => {
  const baseConn = conn || getConn();
  return await getTaskTuukhModel(baseConn, true).findById(id).lean();
};
