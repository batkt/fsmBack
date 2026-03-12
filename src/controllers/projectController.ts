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
    if (req.query.uilchluulegchId) query.uilchluulegchId = req.query.uilchluulegchId;


    // Only filter by employee if explicitly requested via query parameter
    // Don't automatically filter by authenticated user to allow broader queries
    if (req.query.ajiltniiId) {
      query.$or = [
        { udirdagchId: req.query.ajiltniiId },
        { ajiltnuud: req.query.ajiltniiId }
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
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId || req.validatedBaiguullagiinId;
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
    
    // Emit project creation event to project room and organization-wide
    emitToRoom(`project_${project._id}`, "project_created", project);
    if (project.barilgiinId) {
      emitToRoom(`barilga_${project.barilgiinId}`, "project_created", project);
    }

    // Create notifications for project members
    const { medegdelUusgekh }: any = require("../services/medegdelService");
    const notifications: any[] = [];
    
    // Notify project manager
    if (project.udirdagchId) {
      const notif = await medegdelUusgekh({
        ajiltniiId: project.udirdagchId,
        baiguullagiinId: project.baiguullagiinId,
        barilgiinId: project.barilgiinId,
        projectId: project._id.toString(),
        turul: "projectCreated",
        title: "Шинэ төсөл",
        message: `${project.ner} төсөл үүсгэгдлээ`,
        object: project
      });
      notifications.push(notif);
      emitToRoom(`user_${project.udirdagchId}`, "new_notification", notif);
    }

    // Notify project members
    if (project.ajiltnuud && Array.isArray(project.ajiltnuud)) {
      for (const ajiltniiId of project.ajiltnuud) {
        if (ajiltniiId !== project.udirdagchId) {
          const notif = await medegdelUusgekh({
            ajiltniiId: ajiltniiId,
            baiguullagiinId: project.baiguullagiinId,
            barilgiinId: project.barilgiinId,
            projectId: project._id.toString(),
            turul: "projectCreated",
            title: "Шинэ төсөл",
            message: `${project.ner} төсөлд танд хандалт олгогдлоо`,
            object: project
          });
          notifications.push(notif);
          emitToRoom(`user_${ajiltniiId}`, "new_notification", notif);
        }
      }
    }


    if (project.uilchluulegchId) {
      try {
        const { kpiShineelekhUilchluulegch } = require("../services/kpiService");
        await kpiShineelekhUilchluulegch(project.uilchluulegchId);
      } catch (err) {
        console.error("Failed to refresh client KPI:", err);
      }
    }

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: any, res: Response, next: any) => {
  try {
    const project = await projectZasakh(req.params.id, req.body);
    if (!project) return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });

    // Emit project update event
    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom(`project_${project._id}`, "project_updated", project);
    if (project.barilgiinId) {
      emitToRoom(`barilga_${project.barilgiinId}`, "project_updated", project);
    }

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

    // Refresh client KPI if assignment exists
    if (project.uilchluulegchId) {
      try {
        const { kpiShineelekhUilchluulegch } = require("../services/kpiService");
        const stats = await kpiShineelekhUilchluulegch(project.uilchluulegchId);
        
        const { emitToRoom } = require("../utils/socket");
        emitToRoom(`barilga_${project.barilgiinId}`, "client_kpi_updated", {
          uilchluulegchId: project.uilchluulegchId,
          ...stats
        });
      } catch (err) {
        console.error("Failed to refresh client KPI:", err);
      }
    }

    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req: any, res: Response, next: any) => {
  try {
    const { getConn } = require("../utils/db");
    const getTaskModel = require("../models/task");
    const TaskModel = getTaskModel(getConn(), true);

    // Find tasks before deleting project to know which workers' KPIs to refresh
    const tasks = await TaskModel.find({ projectId: req.params.id }).select("hariutsagchId ajiltnuud").lean();
    
    const workersToUpdate = new Set<string>();
    tasks.forEach((t: any) => {
      if (t.hariutsagchId) workersToUpdate.add(t.hariutsagchId);
      if (t.ajiltnuud && Array.isArray(t.ajiltnuud)) {
        t.ajiltnuud.forEach((id: string) => workersToUpdate.add(id));
      }
    });

    const project = await projectUstgakh(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });

    // Delete tasks of this project since project is deleted
    await TaskModel.deleteMany({ projectId: req.params.id });

    const { kpiShineelekh, kpiShineelekhUilchluulegch } = require("../services/kpiService");
    const { emitToRoom } = require("../utils/socket");

    // Refresh client KPI
    if (project.uilchluulegchId) {
      try {
        const stats = await kpiShineelekhUilchluulegch(project.uilchluulegchId);
        emitToRoom(`barilga_${project.barilgiinId}`, "client_kpi_updated", {
          uilchluulegchId: project.uilchluulegchId,
          ...stats
        });
      } catch (err) {
        console.error("Failed to refresh client KPI:", err);
      }
    }

    // Refresh worker KPIs
    for (const workerId of workersToUpdate) {
      try {
        const stats = await kpiShineelekh(workerId, project.baiguullagiinId);
        emitToRoom(`baiguullaga_${project.baiguullagiinId}`, "kpi_updated", {
          userId: workerId,
          ...stats
        });
      } catch (err) {
        console.error(`Failed to refresh worker KPI for ${workerId}:`, err);
      }
    }

    res.json({ success: true, message: "Төсөл амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
