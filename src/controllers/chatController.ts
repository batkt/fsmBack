import { Response } from "express";
import { chatJagsaalt, chatUusgekh, chatUstgakh, chatUnshuulakh } from "../services/chatService";
import { emitToRoom } from "../utils/socket";

export const getChats = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {
      baiguullagiinId: req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId,
    };

    if (req.query.projectId) query.projectId = req.query.projectId;
    
    if (req.query.taskId) {
      query.taskId = req.query.taskId;
    } else if (req.query.projectId) {
  
      query.$or = [
        { taskId: { $exists: false } },
        { taskId: null },
        { taskId: "" }
      ];
    }

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

    // Create notifications for project/task members (except sender)
    const { medegdelUusgekh }: any = require("../services/medegdelService");
    const { projectNegAvakh } = require("../services/projectService");
    const { taskNegAvakh } = require("../services/taskService");
    const senderId = chat.ajiltniiId;

    try {
      // Get project to find members
      const project = await projectNegAvakh(chat.projectId);
      if (project) {
        const membersToNotify = new Set<string>();

        // Add project manager
        if (project.udirdagchId && project.udirdagchId !== senderId) {
          membersToNotify.add(project.udirdagchId);
        }

        // Add project members
        if (project.ajiltnuud && Array.isArray(project.ajiltnuud)) {
          project.ajiltnuud.forEach((id: string) => {
            if (id !== senderId) {
              membersToNotify.add(id);
            }
          });
        }

        // If task chat, also notify task assigned user
        if (chat.taskId) {
          const task = await taskNegAvakh(chat.taskId);
          if (task && task.hariutsagchId && task.hariutsagchId !== senderId) {
            membersToNotify.add(task.hariutsagchId);
          }
        }

        // Create notifications for all members
        for (const memberId of membersToNotify) {
          const messagePreview = chat.medeelel 
            ? (chat.medeelel.length > 50 ? chat.medeelel.substring(0, 50) + "..." : chat.medeelel)
            : (chat.turul === "zurag" ? "Зураг илгээлээ" : chat.turul === "file" ? "Файл илгээлээ" : "Шинэ мессеж");

          const notification = await medegdelUusgekh({
            ajiltniiId: memberId,
            baiguullagiinId: chat.baiguullagiinId,
            barilgiinId: chat.barilgiinId,
            projectId: chat.projectId,
            taskId: chat.taskId || undefined,
            turul: "chatMessage",
            title: chat.taskId ? "Даалгаврын мессеж" : "Төслийн мессеж",
            message: `${chat.ajiltniiNer || "Хэрэглэгч"}: ${messagePreview}`,
            object: chat
          });

          emitToRoom(`user_${memberId}`, "new_notification", notification);
        }
      }
    } catch (notifError) {
      // Don't fail the chat creation if notification creation fails
      console.error("[Chat] Failed to create notifications:", notifError);
    }

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

export const uploadFile = async (req: any, res: Response, next: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Файл олдсонгүй" });
    }

    const { projectId, taskId, barilgiinId } = req.body;
    
    // Determine type
    let turul = "file";
    if (req.file.mimetype.startsWith("image/")) {
      turul = "zurag";
    }

    const data = {
      projectId,
      taskId,
      barilgiinId,
      ajiltniiId: req.ajiltan?.id || req.body.ajiltniiId,
      ajiltniiNer: req.ajiltan?.ner || req.body.ajiltniiNer,
      baiguullagiinId: req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId,
      turul,
      fileZam: `uploads/${req.file.filename}`,
      fileNer: req.file.originalname,
      khemjee: req.file.size,
      fType: req.file.mimetype,
      medeelel: req.body.medeelel || req.file.originalname // Use provided message or default to file name
    };

    const chat = await chatUusgekh(data);

    const room = chat.taskId ? `task_${chat.taskId}` : `project_${chat.projectId}`;
    emitToRoom(room, "new_message", chat);

    // Create notifications for project/task members (except sender)
    const { medegdelUusgekh }: any = require("../services/medegdelService");
    const { projectNegAvakh } = require("../services/projectService");
    const { taskNegAvakh } = require("../services/taskService");
    const senderId = chat.ajiltniiId;

    try {
      // Get project to find members
      const project = await projectNegAvakh(chat.projectId);
      if (project) {
        const membersToNotify = new Set<string>();

        // Add project manager
        if (project.udirdagchId && project.udirdagchId !== senderId) {
          membersToNotify.add(project.udirdagchId);
        }

        // Add project members
        if (project.ajiltnuud && Array.isArray(project.ajiltnuud)) {
          project.ajiltnuud.forEach((id: string) => {
            if (id !== senderId) {
              membersToNotify.add(id);
            }
          });
        }

        // If task chat, also notify task assigned user
        if (chat.taskId) {
          const task = await taskNegAvakh(chat.taskId);
          if (task && task.hariutsagchId && task.hariutsagchId !== senderId) {
            membersToNotify.add(task.hariutsagchId);
          }
        }

        // Create notifications for all members
        for (const memberId of membersToNotify) {
          const fileTypeLabel = chat.turul === "zurag" ? "Зураг" : "Файл";
          const messageText = chat.medeelel || `${fileTypeLabel}: ${chat.fileNer}`;

          const notification = await medegdelUusgekh({
            ajiltniiId: memberId,
            baiguullagiinId: chat.baiguullagiinId,
            barilgiinId: chat.barilgiinId,
            projectId: chat.projectId,
            taskId: chat.taskId || undefined,
            turul: "chatMessage",
            title: chat.taskId ? "Даалгаврын мессеж" : "Төслийн мессеж",
            message: `${chat.ajiltniiNer || "Хэрэглэгч"}: ${messageText}`,
            zurag: chat.turul === "zurag" ? chat.fileZam : undefined,
            object: chat
          });

          emitToRoom(`user_${memberId}`, "new_notification", notification);
        }
      }
    } catch (notifError) {
      // Don't fail the chat creation if notification creation fails
      console.error("[Chat] Failed to create notifications:", notifError);
    }

    res.status(201).json({ success: true, data: chat });
  } catch (err) {
    next(err);
  }
};

export const readChats = async (req: any, res: Response, next: any) => {
  try {
    const { chatIds, projectId, taskId } = req.body;
    const ajiltniiId = req.ajiltan?.id || req.body.ajiltniiId;

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({ success: false, message: "Илгээх чатын ID-уудыг (chatIds) дамжуулна уу" });
    }
    if (!ajiltniiId) {
      return res.status(400).json({ success: false, message: "ajiltniiId шаардлагатай" });
    }

    // Update in DB
    const { chatUnshuulakh } = require("../services/chatService");
    await chatUnshuulakh(chatIds, ajiltniiId);

    // Broadcast over WS
    if (projectId || taskId) {
      const room = taskId ? `task_${taskId}` : `project_${projectId}`;
      emitToRoom(room, "messages_read", { chatIds, ajiltniiId });
    }

    res.json({ success: true, message: "Амжилттай уншсан төлөвт шилжүүллээ." });
  } catch (err) {
    next(err);
  }
};
