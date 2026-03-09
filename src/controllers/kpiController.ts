import { Response } from "express";
import { taskNegAvakh } from "../services/taskService";
import { kpiShineelekh } from "../services/kpiService";
import { emitToRoom } from "../utils/socket";

 
export const giveTaskPoints = async (req: any, res: Response, next: any) => {
  try {
    const taskId   = req.params.id;
    const adminId  = req.ajiltan?.id;
    const { onooson, onoosonTailbar } = req.body;

     
    if (onooson === undefined || onooson === null) {
      return res.status(400).json({ success: false, message: "onooson (оноо) заавал бөглөнө" });
    }
    const points = Number(onooson);
    if (isNaN(points) || points < 0 || points > 10) {
      return res.status(400).json({ success: false, message: "Оноо 0-10 хооронд байх ёстой" });
    }

    
    const task = await taskNegAvakh(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });
    }

    
    if (task.tuluv !== "duussan") {
      return res.status(400).json({
        success: false,
        message: "Оноо өгөхийн тулд даалгавар дууссан байх ёстой (tuluv = duussan)"
      });
    }

    
    const { getConn } = require("../utils/db");
    const getTaskModel = require("../models/task");
    const conn      = getConn();
    const TaskModel = getTaskModel(conn, true);

    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      {
        $set: {
          onooson:       Math.round(points * 10) / 10,  
          onoosonTailbar: onoosonTailbar || "",
          onoosonOgnoo:   new Date(),
          onoosonAdminId: adminId
        }
      },
      { new: true }
    ).lean();

    
    let kpiResult = null;
    if (task.hariutsagchId) {
      try {
        kpiResult = await kpiShineelekh(task.hariutsagchId, task.baiguullagiinId);
        console.log(`[KPI] Recalculated for user ${task.hariutsagchId}:`, kpiResult);
      } catch (kpiErr) {
        console.error("[KPI] Failed to recalculate KPI:", kpiErr);
      }
    }

    
    if (task.hariutsagchId) {
      try {
        const { medegdelUusgekh }: any = require("../services/medegdelService");
        const notification = await medegdelUusgekh({
          ajiltniiId:      task.hariutsagchId,
          baiguullagiinId: task.baiguullagiinId,
          barilgiinId:     task.barilgiinId,
          projectId:       task.projectId,
          taskId:          task._id.toString(),
          turul:           "taskCompleted",
          title:           "Оноо авлаа 🎯",
          message:         `${task.ner} даалгаварт ${points}/10 оноо авлаа${onoosonTailbar ? ": " + onoosonTailbar : ""}`,
          object:          updatedTask
        });
        emitToRoom(`user_${task.hariutsagchId}`, "new_notification", notification);
        
        // Broadcast KPI update to everyone (so admins see it on the dashboard)
        const { getIO } = require("../utils/socket");
        getIO().emit("kpi_updated", {
          userId: task.hariutsagchId,
          ...kpiResult
        });
      } catch (notifErr) {
        console.error("[Task Points] Failed to create notification:", notifErr);
      }
    }

    
    emitToRoom(`project_${task.projectId}`, "task_updated", updatedTask);
    emitToRoom(`task_${task._id}`, "task_updated", updatedTask);

    res.json({
      success: true,
      message: `Оноо амжилттай хадгалагдлаа (${points}/10)`,
      data: updatedTask,
      kpi: kpiResult
    });
  } catch (err) {
    next(err);
  }
};

 
export const getTaskPoints = async (req: any, res: Response, next: any) => {
  try {
    const task = await taskNegAvakh(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });

    res.json({
      success: true,
      data: {
        taskId:          task._id,
        onooson:         task.onooson ?? null,
        onoosonTailbar:  task.onoosonTailbar ?? "",
        onoosonOgnoo:    task.onoosonOgnoo ?? null,
        onoosonAdminId:  task.onoosonAdminId ?? null
      }
    });
  } catch (err) {
    next(err);
  }
};

 
export const getUserKpi = async (req: any, res: Response, next: any) => {
  try {
    const { getConn } = require("../utils/db");
    const getUilchluulegchModel = require("../models/uilchluulegch");
    const conn = getConn();
    const AjiltanModel = getUilchluulegchModel(conn, false, "ajiltan");

    const user = await AjiltanModel.findById(req.params.id)
      .select("ner kpiOnoo kpiDaalgavarToo kpiDundaj kpiHuvv kpiShineelsenOgnoo")
      .lean();

    if (!user) return res.status(404).json({ success: false, message: "Ажилтан олдсонгүй" });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

 
export const refreshUserKpi = async (req: any, res: Response, next: any) => {
  try {
    const userId = req.params.id;
    const { getConn } = require("../utils/db");
    const getUilchluulegchModel = require("../models/uilchluulegch");
    const conn = getConn();
    const AjiltanModel = getUilchluulegchModel(conn, false, "ajiltan");

    const user = await AjiltanModel.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: "Ажилтан олдсонгүй" });

    const kpiResult = await kpiShineelekh(userId, (user as any).baiguullagiinId);

    // Broadcast update
    const { getIO } = require("../utils/socket");
    getIO().emit("kpi_updated", {
      userId: userId,
      ...kpiResult
    });

    res.json({
      success: true,
      message: "KPI амжилттай шинэчлэгдлээ",
      data: kpiResult
    });
  } catch (err) {
    next(err);
  }
};

export const getBaiguullagaKpis = async (req: any, res: Response, next: any) => {
  try {
    const { id: baiguullagiinId } = req.params;
    const { getConn } = require("../utils/db");
    const getUilchluulegchModel = require("../models/uilchluulegch");
    const conn = getConn();
    const AjiltanModel = getUilchluulegchModel(conn, false, "ajiltan");

    const users = await AjiltanModel.find({ baiguullagiinId })
      .select("_id kpiOnoo kpiDaalgavarToo kpiDundaj kpiHuvv kpiShineelsenOgnoo")
      .lean();

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};
