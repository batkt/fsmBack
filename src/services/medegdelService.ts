import { getConn } from "../utils/db";

const getMedegdelModel = require("../models/medegdel");

export const medegdelJagsaalt = async (query: any) => {
  const conn = getConn();
  return await getMedegdelModel(conn)
    .find(query)
    .sort({ createdAt: -1 })
    .lean();
};

export const medegdelUusgekh = async (data: any) => {
  const conn = getConn();
  return await getMedegdelModel(conn).create(data);
};

export const medegdelZasakh = async (id: string, data: any) => {
  const conn = getConn();
  return await getMedegdelModel(conn)
    .findByIdAndUpdate(id, data, { new: true })
    .lean();
};

export const medegdelKharlaa = async (id: string, ajiltniiId: string) => {
  const conn = getConn();
  // Mark as read
  await getMedegdelModel(conn).findByIdAndUpdate(id, {
    $set: { kharsanEsekh: true, tuluv: 1 }
  });
  
  // Remove from "not seen" list if exists
  await getMedegdelModel(conn).findByIdAndUpdate(id, {
    $pull: { dakhijKharakhguiAjiltniiIdnuud: ajiltniiId }
  });
  
  return await getMedegdelModel(conn).findById(id).lean();
};

export const medegdelNegAvakh = async (id: string) => {
  const conn = getConn();
  return await getMedegdelModel(conn).findById(id).lean();
};

export const medegdelUstgakh = async (id: string) => {
  const conn = getConn();
  return await getMedegdelModel(conn).findByIdAndDelete(id);
};

// Mark all notifications as read for a user
export const medegdelBuhKharlaa = async (ajiltniiId: string, baiguullagiinId?: string) => {
  const conn = getConn();
  const query: any = { ajiltniiId, kharsanEsekh: false };
  if (baiguullagiinId) query.baiguullagiinId = baiguullagiinId;
  
  return await getMedegdelModel(conn).updateMany(query, {
    $set: { kharsanEsekh: true, tuluv: 1 },
    $pull: { dakhijKharakhguiAjiltniiIdnuud: ajiltniiId }
  });
};

// Get unread count for a user
export const medegdelUnreadCount = async (ajiltniiId: string, baiguullagiinId?: string) => {
  const conn = getConn();
  const query: any = { ajiltniiId, kharsanEsekh: false };
  if (baiguullagiinId) query.baiguullagiinId = baiguullagiinId;
  
  return await getMedegdelModel(conn).countDocuments(query);
};
