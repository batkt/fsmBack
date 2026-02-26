import { Response } from "express";
import {
  taskJagsaalt,
  taskUusgekh,
  taskZasakh,
  taskUstgakh,
  taskNegAvakh,
} from "../services/taskService";
import { taskTuukhUusgekh } from "../services/taskTuukhService";

export const getTasks = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {};
    const bid = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    if (bid) query.baiguullagiinId = bid;

    if (req.query.projectId) query.projectId = req.query.projectId;
    if (req.query.tuluv) query.tuluv = req.query.tuluv;
    if (req.query.zereglel) query.zereglel = req.query.zereglel;
    if (req.query.hariutsagchId) query.hariutsagchId = req.query.hariutsagchId;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;

    const tasks = await taskJagsaalt(query);
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

export const getTask = async (req: any, res: Response, next: any) => {
  try {
    const task = await taskNegAvakh(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const data = {
      ...req.body,
      ...(bid && { baiguullagiinId: bid })
    };
    const task = await taskUusgekh(data);
    
    // Automatically create a chat message
    const { chatUusgekh }: any = require("../services/chatService");
    const { emitToRoom }: any = require("../utils/socket");

    const initialMessage = await chatUusgekh({
      projectId: task.projectId,
      taskId: task._id,
      ajiltniiId: req.ajiltan?.id || "system",
      ajiltniiNer: req.ajiltan?.ner || "System",
      medeelel: `Шинэ даалгавар үүсгэгдлээ: ${task.ner} (${task.taskId})`,
      turul: "text",
      baiguullagiinId: task.baiguullagiinId,
      barilgiinId: task.barilgiinId
    });

    // Notify project room and task room
    emitToRoom(`project_${task.projectId}`, "new_message", initialMessage);
    emitToRoom(`task_${task._id}`, "new_message", initialMessage);

    // Log history
    await taskTuukhUusgekh({
      ...task.toObject(),
      sourceTaskId: task._id,
      taskCode: task.taskId,
      ajiltniiId: req.ajiltan?.id,
      ajiltniiNer: req.ajiltan?.ner,
      uildel: "created"
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: any, res: Response, next: any) => {
  try {
    const task = await taskZasakh(req.params.id, req.body);
    if (!task) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });

    // Log history
    let action = "updated";
    if (req.body.tuluv === "duussan") action = "completed";

    await taskTuukhUusgekh({
      ...task,
      sourceTaskId: task._id,
      taskCode: task.taskId,
      ajiltniiId: req.ajiltan?.id,
      ajiltniiNer: req.ajiltan?.ner,
      uildel: action
    });

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: any, res: Response, next: any) => {
  try {
    // Save to history before deleting
    const existing = await taskNegAvakh(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });

    await taskTuukhUusgekh({
      ...existing,
      sourceTaskId: existing._id,
      taskCode: existing.taskId,
      duussanOgnoo: new Date(),
      ajiltniiId: req.ajiltan?.id,
      ajiltniiNer: req.ajiltan?.ner,
      uildel: "deleted"
    });

    await taskUstgakh(req.params.id);
    res.json({ success: true, message: "Даалгавар амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
