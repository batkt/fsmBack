import { getConn } from "../utils/db";
import { ensureFsmConn } from "../utils/fsmConn";
const getBaraaModel = require("../models/baraa");
const getTaskModel = require("../models/task");

// All functions accept optional conn for per-org FSM DB.
// If conn is not provided, fall back to global getConn() (main DB).

export const baraaJagsaalt = async (query: any, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  return await getBaraaModel(baseConn, true).find(query).sort({ createdAt: -1 }).lean();
};

export const baraaUusgekh = async (data: any, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  return await getBaraaModel(baseConn, true).create(data);
};

export const baraaZasakh = async (id: string, data: any, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  return await getBaraaModel(baseConn, true).findByIdAndUpdate(id, data, { new: true }).lean();
};

export const baraaUstgakh = async (id: string, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  return await getBaraaModel(baseConn, true).findByIdAndDelete(id);
};

export const baraaNegAvakh = async (id: string, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  return await getBaraaModel(baseConn, true).findById(id).lean();
};

export const baraaAshiglalatStats = async (baiguullagiinId: string, barilgiinId: string, startDate?: Date, endDate?: Date, conn?: any) => {
  const baseConn = ensureFsmConn(conn || getConn());
  const TaskModel = getTaskModel(baseConn, true);
  
  const query: any = { 
    baiguullagiinId, 
    barilgiinId,
    "baraa.0": { $exists: true } 
  };

  if (startDate || endDate) {
    const dateQuery: any = {};
    if (startDate) dateQuery.$gte = startDate;
    if (endDate) dateQuery.$lte = endDate;
    query["baraa.ognoo"] = dateQuery;
  }
  
  const tasks = await TaskModel.find(query).select("baraa").lean();
  
  const stats: any = {};
  tasks.forEach((task: any) => {
    if (task.baraa) {
      task.baraa.forEach((b: any) => {
        if (startDate || endDate) {
          const entryDate = new Date(b.ognoo || task.createdAt);
          if (startDate && entryDate < startDate) return;
          if (endDate && entryDate > endDate) return;
        }

        const key = b.baraaId || b.ner;
        if (!key) return; // skip entries with no identifier

        if (!stats[key]) {
          stats[key] = {
            baraaId: b.baraaId,
            ner: b.ner,
            too: 0
          };
        }
        stats[key].too += Math.abs(Number(b.too) || 0); // ← fix: always positive
      });
    }
  });
  
  return Object.values(stats)
    .filter((s: any) => s.too > 0)  // ← fix: exclude zeros
    .sort((a: any, b: any) => b.too - a.too);
};

