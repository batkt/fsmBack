import { getConn } from "../utils/db";
const getSubTaskModel = require("../models/subTask");

export const subTaskJagsaalt = async (query: any, conn?: any) => {
  const baseConn = conn || getConn();
  return await getSubTaskModel(baseConn, true).find(query).sort({ createdAt: 1 }).lean();
};

export const subTaskUusgekh = async (data: any, conn?: any) => {
  const baseConn = conn || getConn();
  return await getSubTaskModel(baseConn, true).create(data);
};

export const subTaskZasakh = async (id: string, data: any, conn?: any) => {
  const baseConn = conn || getConn();
  return await getSubTaskModel(baseConn, true).findByIdAndUpdate(id, data, { new: true }).lean();
};

export const subTaskUstgakh = async (id: string, conn?: any) => {
  const baseConn = conn || getConn();
  return await getSubTaskModel(baseConn, true).findByIdAndDelete(id);
};

export const subTaskNegAvakh = async (id: string, conn?: any) => {
  const baseConn = conn || getConn();
  return await getSubTaskModel(baseConn, true).findById(id).lean();
};
