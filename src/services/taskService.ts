import { getConn } from "../utils/db";
const getTaskModel = require("../models/task");
const getBaraaModel = require("../models/baraa");

export const taskJagsaalt = async (query: any) => {
  return await getTaskModel(getConn()).find(query).sort({ createdAt: -1 }).lean();
};

export const taskUusgekh = async (data: any) => {
  const conn = getConn();
  const getProjectModel = require("../models/project");
  const TaskModel = getTaskModel(conn);
  const ProjectModel = getProjectModel(conn);
  const BaraaModel = getBaraaModel(conn); // FSM by default

  // Dates are saved as-is from frontend (no conversion)
  // Frontend should send dates in the format it wants stored

  const project = await ProjectModel.findById(data.projectId);
  if (!project) throw new Error("Төсөл олдсонгүй");

  const prefix = (project.ner).substring(0, 3).toUpperCase();

  const updatedProject = await ProjectModel.findByIdAndUpdate(
    data.projectId,
    { $inc: { taskCount: 1 } },
    { new: true }
  );

  const taskNumber = updatedProject.taskCount;
  const formattedNumber = taskNumber.toString().padStart(4, "0");

  data.taskId = `${prefix}-${formattedNumber}`;
  if (project.color) {
    data.color = project.color;
  }

  // Inherit baiguullagiinId and barilgiinId from project if not provided
  if (!data.baiguullagiinId && project.baiguullagiinId) {
    data.baiguullagiinId = project.baiguullagiinId;
  }
  if (!data.barilgiinId && project.barilgiinId) {
    data.barilgiinId = project.barilgiinId;
  }

  const task = await TaskModel.create(data);

  // If task has baraa usage defined, decrease baraa inventory (uldegdel)
  if (Array.isArray(data.baraa) && data.baraa.length > 0) {
    for (const item of data.baraa) {
      if (!item || !item.baraaId) continue;
      const qty = Number(item.too) || 0;
      if (qty === 0) continue;

      await BaraaModel.findByIdAndUpdate(
        item.baraaId,
        { $inc: { uldegdel: -Math.abs(qty) } },
        { new: false }
      );
    }
  }

  // Automatically add assigned employees to project's ajiltnuud array
  const employeesToAdd: string[] = [];
  if (data.hariutsagchId) {
    employeesToAdd.push(data.hariutsagchId);
  }
  if (data.ajiltnuud && Array.isArray(data.ajiltnuud)) {
    employeesToAdd.push(...data.ajiltnuud);
  }

  if (employeesToAdd.length > 0) {
    await ProjectModel.findByIdAndUpdate(
      data.projectId,
      { $addToSet: { ajiltnuud: { $each: employeesToAdd } } },
      { new: true }
    );
  }

  return task;
};

export const taskZasakh = async (id: string, data: any) => {
  const conn = getConn();
  const TaskModel = getTaskModel(conn);
  const getProjectModel = require("../models/project");
  const ProjectModel = getProjectModel(conn);
  const BaraaModel = getBaraaModel(conn);

  // Dates are saved as-is from frontend (no conversion)
  // Frontend should send dates in the format it wants stored

  // Get the task to find its projectId and current baraa usage
  const existingTask = await TaskModel.findById(id).lean();
  if (!existingTask) return null;

  // If baraa is being updated, adjust inventory based on difference
  if (Array.isArray(data.baraa)) {
    const oldBaraa = Array.isArray(existingTask.baraa) ? existingTask.baraa : [];
    const newBaraa = data.baraa;

    // Build maps baraaId -> total quantity
    const sumById = (items: any[]) => {
      const map = new Map<string, number>();
      for (const it of items) {
        if (!it || !it.baraaId) continue;
        const idStr = String(it.baraaId);
        const qty = Number(it.too) || 0;
        if (!map.has(idStr)) map.set(idStr, 0);
        map.set(idStr, (map.get(idStr) || 0) + qty);
      }
      return map;
    };

    const oldMap = sumById(oldBaraa);
    const newMap = sumById(newBaraa);

    const allIds = new Set<string>([...Array.from(oldMap.keys()), ...Array.from(newMap.keys())]);

    for (const baraaId of allIds) {
      const oldQty = oldMap.get(baraaId) || 0;
      const newQty = newMap.get(baraaId) || 0;
      const delta = newQty - oldQty;

      if (delta === 0) continue;

      // If delta > 0, we are using more → decrease inventory
      // If delta < 0, we reduced usage → increase inventory back
      await BaraaModel.findByIdAndUpdate(
        baraaId,
        { $inc: { uldegdel: -delta } }, // delta positive => -delta; delta negative => +|delta|
        { new: false }
      );
    }
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(id, data, { new: true }).lean();

  // Automatically add assigned employees to project's ajiltnuud array
  const employeesToAdd: string[] = [];
  if (data.hariutsagchId) {
    employeesToAdd.push(data.hariutsagchId);
  }
  if (data.ajiltnuud && Array.isArray(data.ajiltnuud)) {
    employeesToAdd.push(...data.ajiltnuud);
  }

  if (employeesToAdd.length > 0) {
    await ProjectModel.findByIdAndUpdate(
      existingTask.projectId,
      { $addToSet: { ajiltnuud: { $each: employeesToAdd } } },
      { new: true }
    );
  }

  return updatedTask;
};

export const taskUstgakh = async (id: string) => {
  return await getTaskModel(getConn()).findByIdAndDelete(id);
};

export const taskNegAvakh = async (id: string) => {
  return await getTaskModel(getConn()).findById(id).lean();
};
