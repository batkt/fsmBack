import { getConn } from "../utils/db";
const getBaraaModel = require("../models/baraa");

export const baraaJagsaalt = async (query: any) => {
  return await getBaraaModel(getConn()).find(query).sort({ createdAt: -1 }).lean();
};

export const baraaUusgekh = async (data: any) => {
  return await getBaraaModel(getConn()).create(data);
};

export const baraaZasakh = async (id: string, data: any) => {
  return await getBaraaModel(getConn()).findByIdAndUpdate(id, data, { new: true }).lean();
};

export const baraaUstgakh = async (id: string) => {
  return await getBaraaModel(getConn()).findByIdAndDelete(id);
};

export const baraaNegAvakh = async (id: string) => {
  return await getBaraaModel(getConn()).findById(id).lean();
};

export const baraaAshiglalatStats = async (baiguullagiinId: string, barilgiinId: string, startDate?: Date, endDate?: Date) => {
  const getTaskModel = require("../models/task");
  const TaskModel = getTaskModel(getConn());
  
  const query: any = { 
    baiguullagiinId, 
    barilgiinId,
    "baraa.0": { $exists: true } 
  };

  if (startDate || endDate) {
    const dateQuery: any = {};
    if (startDate) dateQuery.$gte = startDate;
    if (endDate) dateQuery.$lte = endDate;
    // Filter tasks that have at least one baraa usage within this range
    query["baraa.ognoo"] = dateQuery;
  }
  
  const tasks = await TaskModel.find(query).select("baraa").lean();
  
  const stats: any = {};
  tasks.forEach((task: any) => {
    if (task.baraa) {
      task.baraa.forEach((b: any) => {
        // If we have a range, only aggregate baraa entries within that range
        if (startDate || endDate) {
          const entryDate = new Date(b.ognoo || task.createdAt);
          if (startDate && entryDate < startDate) return;
          if (endDate && entryDate > endDate) return;
        }

        const key = b.baraaId || b.ner;
        if (!stats[key]) {
          stats[key] = {
            baraaId: b.baraaId,
            ner: b.ner,
            too: 0
          };
        }
        stats[key].too += (b.too || 0);
      });
    }
  });
  
  return Object.values(stats).sort((a: any, b: any) => b.too - a.too);
};

