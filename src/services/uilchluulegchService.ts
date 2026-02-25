import { getConn } from "../utils/db";
import getUilchluulegchModel from "../models/uilchluulegch";

export const uilchluulegchJagsaalt = async (query: any) => {
  return await getUilchluulegchModel(getConn()).find(query).sort({ createdAt: -1 }).lean();
};

export const uilchluulegchUusgekh = async (data: any) => {
  return await getUilchluulegchModel(getConn()).create(data);
};

export const uilchluulegchZasakh = async (id: string, data: any) => {
  return await getUilchluulegchModel(getConn()).findByIdAndUpdate(id, data, { new: true }).lean();
};

export const uilchluulegchUstgakh = async (id: string) => {
  return await getUilchluulegchModel(getConn()).findByIdAndDelete(id);
};

export const uilchluulegchNegAvakh = async (id: string) => {
  return await getUilchluulegchModel(getConn()).findById(id).lean();
};
