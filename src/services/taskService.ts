import { ensureFsmConn } from "../utils/fsmConn";
const getTaskModel = require("../models/task");
const getBaraaModel = require("../models/baraa");
const getProjectModel = require("../models/project");

// All functions require explicit conn for per-org FSM DB.

export const taskJagsaalt = async (query: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getTaskModel(baseConn, true).find(query).sort({ createdAt: -1 }).lean();
};

export const taskUusgekh = async (data: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  const TaskModel = getTaskModel(baseConn, true);
  const ProjectModel = getProjectModel(baseConn, true);
  const BaraaModel = getBaraaModel(baseConn, true);
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
  if (!data.uilchluulegchId && project.uilchluulegchId) {
    data.uilchluulegchId = project.uilchluulegchId;
  }

  // Handle Full Day (isDay) normalization
  if (data.isDay) {
    if (data.ekhlekhOgnoo) {
      const start = new Date(data.ekhlekhOgnoo);
      start.setHours(0, 0, 0, 0);
      data.ekhlekhTsag = start;
    }
    if (data.duusakhOgnoo) {
      const end = new Date(data.duusakhOgnoo);
      end.setHours(23, 59, 59, 999);
      data.duusakhTsag = end;
    }
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

export const taskZasakh = async (id: string, data: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  const TaskModel = getTaskModel(baseConn, true);
  const ProjectModel = getProjectModel(baseConn, true);
  const BaraaModel = getBaraaModel(baseConn, true);

  // Dates are saved as-is from frontend (no conversion)
  // Frontend should send dates in the format it wants stored

  // Get the task to find its projectId and current baraa usage
  const existingTask = await TaskModel.findById(id).lean();
  if (!existingTask) return null;

  // Handle Full Day (isDay) normalization for updates
  const isDay = data.isDay !== undefined ? data.isDay : existingTask.isDay;
  if (isDay) {
    if (data.ekhlekhOgnoo || existingTask.ekhlekhOgnoo) {
      const start = new Date(data.ekhlekhOgnoo || existingTask.ekhlekhOgnoo);
      start.setHours(0, 0, 0, 0);
      data.ekhlekhTsag = start;
    }
    if (data.duusakhOgnoo || existingTask.duusakhOgnoo) {
      const end = new Date(data.duusakhOgnoo || existingTask.duusakhOgnoo);
      end.setHours(23, 59, 59, 999);
      data.duusakhTsag = end;
    }
  }

  // Handle duussanOgnoo and timers
  if (data.tuluv === "duussan" && existingTask.tuluv !== "duussan") {
    data.duussanOgnoo = new Date();
    // Stop all active timers
    if (Array.isArray(existingTask.ajiltanTsag)) {
      data.ajiltanTsag = existingTask.ajiltanTsag.map((entry: any) => {
        if (!entry.duusakhTsag) {
          entry.duusakhTsag = data.duussanOgnoo;
          const durationMs = data.duussanOgnoo.getTime() - new Date(entry.ekhlekhTsag).getTime();
          entry.tsagMinute = Math.round(durationMs / (1000 * 60));
        }
        return entry;
      });
    }
  } else if (data.tuluv && data.tuluv !== "duussan") {
    data.duussanOgnoo = null;
  }

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

export const taskUstgakh = async (id: string, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getTaskModel(baseConn, true).findByIdAndDelete(id);
};

export const taskNegAvakh = async (id: string, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getTaskModel(baseConn, true).findById(id).lean();
};

/**
 * Start time tracking for an employee on a task
 * Creates a new time entry with start time (no end time yet)
 */
export const startTaskTime = async (taskId: string, ajiltniiId: string, tailbar: string | undefined, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  const TaskModel = getTaskModel(baseConn, true);

  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new Error("Даалгавар олдсонгүй");
  }

  // Check if employee already has an active time entry (started but not ended)
  const existingEntries = Array.isArray(task.ajiltanTsag) ? task.ajiltanTsag : [];
  const activeEntry = existingEntries.find(
    (entry: any) => entry.ajiltniiId === ajiltniiId && !entry.duusakhTsag
  );

  if (activeEntry) {
    throw new Error("Энэ ажилтан аль хэдийн цаг тоолж эхэлсэн байна");
  }

  // Add new time entry with start time
  const startTime = new Date();
  const newTimeEntry = {
    ajiltniiId: ajiltniiId,
    ekhlekhTsag: startTime,
    duusakhTsag: null,
    tsagMinute: null,
    tailbar: tailbar || "",
    ognoo: startTime
  };

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId,
    { $push: { ajiltanTsag: newTimeEntry } },
    { new: true }
  ).lean();

  return {
    success: true,
    task: updatedTask,
    timeEntry: newTimeEntry,
    message: "Цаг тоолох эхэлсэн"
  };
};

/**
 * End time tracking for an employee on a task
 * Finds the active entry (no duusakhTsag) and updates it with end time and calculated duration
 */
export const endTaskTime = async (taskId: string, ajiltniiId: string, tailbar: string | undefined, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  const TaskModel = getTaskModel(baseConn, true);

  const task = await TaskModel.findById(taskId);
  if (!task) {
    throw new Error("Даалгавар олдсонгүй");
  }

  const existingEntries = Array.isArray(task.ajiltanTsag) ? task.ajiltanTsag : [];
  
  // Find the active entry (started but not ended) for this employee
  const activeEntryIndex = existingEntries.findIndex(
    (entry: any) => entry.ajiltniiId === ajiltniiId && !entry.duusakhTsag
  );

  if (activeEntryIndex === -1) {
    throw new Error("Энэ ажилтан цаг тоолж эхлээгүй байна");
  }

  const activeEntry = existingEntries[activeEntryIndex];
  const endTime = new Date();
  const startTime = new Date(activeEntry.ekhlekhTsag);
  
  // Calculate duration in minutes
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.round(durationMs / (1000 * 60));

  // Update the specific entry in the array
  const updatedEntries = [...existingEntries];
  updatedEntries[activeEntryIndex] = {
    ...activeEntry,
    duusakhTsag: endTime,
    tsagMinute: durationMinutes,
    tailbar: tailbar || activeEntry.tailbar || ""
  };

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId,
    { $set: { ajiltanTsag: updatedEntries } },
    { new: true }
  ).lean();

  return {
    success: true,
    task: updatedTask,
    timeEntry: updatedEntries[activeEntryIndex],
    durationMinutes: durationMinutes,
    message: `Цаг тоолох дууссан. Нийт: ${durationMinutes} минут`
  };
};
