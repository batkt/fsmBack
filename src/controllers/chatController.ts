import { Response } from "express";
import { chatJagsaalt, chatUusgekh, chatUstgakh } from "../services/chatService";
import { emitToRoom } from "../utils/socket";

export const getChats = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {
      baiguullagiinId: req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId,
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
      ajiltniiId: req.ajiltan?.id || req.body.ajiltniiId,
      ajiltniiNer: req.ajiltan?.ner || req.body.ajiltniiNer,
      baiguullagiinId: req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId,
    };
    const chat = await chatUusgekh(data);

    const room = chat.taskId ? `task_${chat.taskId}` : `project_${chat.projectId}`;
    emitToRoom(room, "new_message", chat);

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
