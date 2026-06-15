import { ensureFsmConn } from "../utils/fsmConn";
const getBaraaModel = require("../models/baraa");
const getTaskModel = require("../models/task");

// All functions require explicit conn for per-org FSM DB.

export const baraaJagsaalt = async (query: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getBaraaModel(baseConn, true).find(query).sort({ createdAt: -1 }).lean();
};

export const baraaUusgekh = async (data: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getBaraaModel(baseConn, true).create(data);
};

export const baraaAshiglalatTimeline = async (
  baiguullagiinId: string,
  barilgiinId: string,
  startDate: Date | undefined,
  endDate: Date | undefined,
  conn: any
) => {
  const baseConn = ensureFsmConn(conn);
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

  const tasks = await TaskModel.find(query)
    .select("ner taskId baraa hariutsagchId ajiltnuud createdAt projectId")
    .lean();

  const ProjectModel = require("../models/project")(baseConn, true);
  const projectIds = [...new Set(tasks.map((t: any) => t.projectId).filter(Boolean))];
  const projects = await ProjectModel.find({ _id: { $in: projectIds } }).select("ner").lean();
  const projectNameMap: any = {};
  projects.forEach((p: any) => { projectNameMap[String(p._id)] = p.ner; });

  // Resolve employee names
  const AjiltanModel = require("../models/ajiltan")(baseConn, false);
  const ajiltanIds = new Set<string>();
  tasks.forEach((t: any) => {
    if (t.hariutsagchId) ajiltanIds.add(t.hariutsagchId);
    if (Array.isArray(t.ajiltnuud)) t.ajiltnuud.forEach((a: string) => ajiltanIds.add(a));
  });
  const ajiltnuud = await AjiltanModel.find({ _id: { $in: Array.from(ajiltanIds) } })
    .select("ner nevtrekhNer")
    .lean();
  const ajiltanNameMap: any = {};
  ajiltnuud.forEach((a: any) => { ajiltanNameMap[String(a._id)] = a.ner || a.nevtrekhNer || "Ажилтан"; });

  const entries: any[] = [];

  tasks.forEach((task: any) => {
    if (!Array.isArray(task.baraa)) return;

    // Determine responsible employee name(s) for this task
    const employeeIds: string[] = [];
    if (task.hariutsagchId) employeeIds.push(task.hariutsagchId);
    if (Array.isArray(task.ajiltnuud)) employeeIds.push(...task.ajiltnuud);
    const uniqueEmployeeIds = [...new Set(employeeIds)];
    const employeeNames = uniqueEmployeeIds.map(id => ajiltanNameMap[id] || "Ажилтан");

    task.baraa.forEach((b: any) => {
      const too = Math.abs(Number(b.too) || 0);
      if (too <= 0) return;

      const entryDate = new Date(b.ognoo || task.createdAt);
      if (startDate && entryDate < startDate) return;
      if (endDate && entryDate > endDate) return;

      entries.push({
        ognoo: entryDate.toISOString().slice(0, 10), // YYYY-MM-DD
        taskId: task._id,
        taskNer: task.ner,
        taskCode: task.taskId,
        projectNer: projectNameMap[String(task.projectId)] || "",
        baraaId: b.baraaId,
        baraaNer: b.ner,
        negj: b.negj,
        too,
        ajiltniiIds: uniqueEmployeeIds,
        ajiltniiNers: employeeNames
      });
    });
  });

  // Sort newest first
  entries.sort((a, b) => (a.ognoo < b.ognoo ? 1 : -1));

  return entries;
};
export const baraaIncomeNemekh = async (baraaId: string, too: number, tailbar: string, ognoo: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  const BaraaModel = getBaraaModel(baseConn, true);

  const updated = await BaraaModel.findByIdAndUpdate(
    baraaId,
    { $inc: { uldegdel: Math.abs(too) } }, // income always positive, in baraa's native unit (хайрцаг for haire)
    { new: true }
  ).lean();

  if (!updated) throw new Error("Бараа олдсонгүй");

  // Optional: log to taskTuukh or a separate baraaTuukh collection for history
  return updated;
};
export const baraaZasakh = async (id: string, data: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getBaraaModel(baseConn, true).findByIdAndUpdate(id, data, { new: true }).lean();
};

export const baraaUstgakh = async (id: string, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getBaraaModel(baseConn, true).findByIdAndDelete(id);
};

export const baraaNegAvakh = async (id: string, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getBaraaModel(baseConn, true).findById(id).lean();
};

export const baraaAshiglalatStats = async (baiguullagiinId: string, barilgiinId: string, startDate: Date | undefined, endDate: Date | undefined, conn: any) => {
  const baseConn = ensureFsmConn(conn);
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

