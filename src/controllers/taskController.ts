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
    const query: any = {
      baiguullagiinId: req.ajiltan.baiguullagiinId,
    };

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
    const data = {
      ...req.body,
      baiguullagiinId: req.ajiltan.baiguullagiinId,
    };
    const task = await taskUusgekh(data);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: any, res: Response, next: any) => {
  try {
    const task = await taskZasakh(req.params.id, req.body);
    if (!task) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });
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
      taskId: existing._id,
      duussanOgnoo: new Date(),
    });

    await taskUstgakh(req.params.id);
    res.json({ success: true, message: "Даалгавар амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
