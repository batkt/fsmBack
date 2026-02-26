import { Response } from "express";
import {
  projectJagsaalt,
  projectUusgekh,
  projectZasakh,
  projectUstgakh,
  projectNegAvakh,
} from "../services/projectService";

export const getProjects = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {};
    const bid = req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId;
    if (bid) query.baiguullagiinId = bid;

    if (req.query.tuluv) query.tuluv = req.query.tuluv;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;

    const ajiltniiId = req.ajiltan?.id || req.query.ajiltniiId;
    if (ajiltniiId) {
      query.$or = [
        { udirdagchId: ajiltniiId },
        { ajiltnuud: ajiltniiId }
      ];
    }

    const projects = await projectJagsaalt(query);
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req: any, res: Response, next: any) => {
  try {
    const project = await projectNegAvakh(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const data = {
      ...req.body,
      ...(bid && { baiguullagiinId: bid })
    };
    const project = await projectUusgekh(data);

    // Automatically create a chat message
    const { chatUusgekh }: any = require("../services/chatService");
    const { emitToRoom }: any = require("../utils/socket");
    
    const initialMessage = await chatUusgekh({
      projectId: project._id,
      ajiltniiId: req.ajiltan?.id || "system",
      ajiltniiNer: req.ajiltan?.ner || "System",
      medeelel: `Шинэ төсөл үүсгэгдлээ: ${project.ner}`,
      turul: "text",
      baiguullagiinId: project.baiguullagiinId,
      barilgiinId: project.barilgiinId
    });

    emitToRoom(`project_${project._id}`, "new_message", initialMessage);

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: any, res: Response, next: any) => {
  try {
    const project = await projectZasakh(req.params.id, req.body);
    if (!project) return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });

    // Log history if completed
    if (req.body.tuluv === "duussan") {
      const { taskTuukhUusgekh }: any = require("../services/taskTuukhService");
      await taskTuukhUusgekh({
        projectId: project._id,
        ner: project.ner,
        baiguullagiinId: project.baiguullagiinId,
        barilgiinId: project.barilgiinId,
        ajiltniiId: req.ajiltan?.id,
        ajiltniiNer: req.ajiltan?.ner,
        uildel: "completed",
        turul: "milestone"
      });
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req: any, res: Response, next: any) => {
  try {
    const project = await projectUstgakh(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });
    res.json({ success: true, message: "Төсөл амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
