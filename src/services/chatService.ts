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

export const chatUnshuulakh = async (chatIds: string[], ajiltniiId: string) => {
  return await getChatModel(getConn()).updateMany(
    { _id: { $in: chatIds } },
    { $addToSet: { unshsan: ajiltniiId } }
  );
};
