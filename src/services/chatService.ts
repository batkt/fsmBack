import { getConn } from "../utils/db";
const getChatModel = require("../models/chat");

export const chatJagsaalt = async (query: any) => {
  return await getChatModel(getConn()).find(query).sort({ createdAt: 1 }).lean();
};

export const chatUusgekh = async (data: any) => {
  return await getChatModel(getConn()).create(data);
};

export const chatUstgakh = async (id: string) => {
  return await getChatModel(getConn()).findByIdAndDelete(id);
};
