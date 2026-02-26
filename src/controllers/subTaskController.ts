import { Response } from "express";
import {
  subTaskJagsaalt,
  subTaskUusgekh,
  subTaskZasakh,
  subTaskUstgakh,
  subTaskNegAvakh,
} from "../services/subTaskService";

export const getSubTasks = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {};
    const bid = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    if (bid) query.baiguullagiinId = bid;
    
    if (req.query.taskId) query.taskId = req.query.taskId;
    if (req.query.projectId) query.projectId = req.query.projectId;

    const list = await subTaskJagsaalt(query);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const getSubTask = async (req: any, res: Response, next: any) => {
  try {
    const item = await subTaskNegAvakh(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Дэд даалгавар олдсонгүй" });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const createSubTask = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const data = {
      ...req.body,
      ...(bid && { baiguullagiinId: bid })
    };
    const item = await subTaskUusgekh(data);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const updateSubTask = async (req: any, res: Response, next: any) => {
  try {
    const item = await subTaskZasakh(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, message: "Дэд даалгавар олдсонгүй" });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const deleteSubTask = async (req: any, res: Response, next: any) => {
  try {
    await subTaskUstgakh(req.params.id);
    res.json({ success: true, message: "Дэд даалгавар амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
