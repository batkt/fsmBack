import { getConn } from "../utils/db";
import { ensureFsmConn } from "../utils/fsmConn";
const getUilchluulegchModel = require("../models/uilchluulegch");

export const uilchluulegchJagsaalt = async (query: any, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  return await getUilchluulegchModel(baseConn, true).find(query).sort({ createdAt: -1 }).lean();
};

export const uilchluulegchUusgekh = async (data: any, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  return await getUilchluulegchModel(baseConn, true).create(data);
};

export const uilchluulegchZasakh = async (id: string, data: any, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  return await getUilchluulegchModel(baseConn, true).findByIdAndUpdate(id, data, { new: true }).lean();
};

export const uilchluulegchUstgakh = async (id: string, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  return await getUilchluulegchModel(baseConn, true).findByIdAndDelete(id);
};

export const uilchluulegchNegAvakh = async (id: string, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  return await getUilchluulegchModel(baseConn, true).findById(id).lean();
};
