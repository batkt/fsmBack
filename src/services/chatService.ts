import { ensureFsmConn } from "../utils/fsmConn";
const getChatModel = require("../models/chat");

// All functions require explicit conn for per-org FSM DB.

export const chatJagsaalt = async (query: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getChatModel(baseConn, true).find(query).sort({ createdAt: 1 }).lean();
};

export const chatUusgekh = async (data: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getChatModel(baseConn, true).create(data);
};


export const chatUstgakh = async (id: string, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getChatModel(baseConn, true).findByIdAndDelete(id);
};
export const chatSoftUstgakh = async (id: string, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getChatModel(baseConn, true).findByIdAndUpdate(
    id,
    { $set: { isDeleted: true, medeelel: "" } },
    { new: true }
  ).lean();
};


export const chatZasakh = async (id: string, newMedeelel: string, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getChatModel(baseConn, true).findByIdAndUpdate(
    id,
    { $set: { medeelel: newMedeelel, isEdited: true, editedAt: new Date() } },
    { new: true }
  ).lean();
};

export const chatUnshuulakh = async (chatIds: string[], ajiltniiId: string, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getChatModel(baseConn, true).updateMany(
    { _id: { $in: chatIds } },
    { $addToSet: { unshsan: ajiltniiId } }
  );
};
