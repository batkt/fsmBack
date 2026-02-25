import { Response } from "express";
import { chatJagsaalt, chatUusgekh, chatUstgakh } from "../services/chatService";

export const getChats = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {
      baiguullagiinId: req.ajiltan.baiguullagiinId,
    };

    if (req.query.projectId) query.projectId = req.query.projectId;
    if (req.query.taskId) query.taskId = req.query.taskId;

    const chats = await chatJagsaalt(query);
    res.json({ success: true, data: chats });
  } catch (err) {
    next(err);
  }
};

export const createChat = async (req: any, res: Response, next: any) => {
  try {
    const data = {
      ...req.body,
      ajiltniiId: req.ajiltan.id,
      ajiltniiNer: req.ajiltan.ner,
      baiguullagiinId: req.ajiltan.baiguullagiinId,
    };
    const chat = await chatUusgekh(data);
    res.status(201).json({ success: true, data: chat });
  } catch (err) {
    next(err);
  }
};

export const deleteChat = async (req: any, res: Response, next: any) => {
  try {
    const chat = await chatUstgakh(req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: "Чат олдсонгүй" });
    res.json({ success: true, message: "Чат амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
