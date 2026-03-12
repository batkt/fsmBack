import { Response } from "express";
import { taskNegAvakh } from "../services/taskService";
import { kpiShineelekh, kpiShineelekhUilchluulegch } from "../services/kpiService";
import { emitToRoom } from "../utils/socket";

 
export const giveTaskPoints = async (req: any, res: Response, next: any) => {
  try {
    const taskId   = req.params.id;
    const adminId  = req.ajiltan?.id;
    const { onooson, onoosonTailbar } = req.body;

     
    if (onooson === undefined || onooson === null) {
      return res.status(400).json({ success: false, message: "Оноо заавал бөглөнө" });
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
        message: "Оноо өгөхийн тулд даалгавар дууссан байх ёстой"
      });
    }

    
    const { getConn } = require("../utils/db");
    const getTaskModel = require("../models/task");
    const conn      = getConn();
    const TaskModel = getTaskModel(conn, true);

    const onoosonVal = Math.round(points * 10) / 10;
    const uilchluulegchOnooson = task.uilchluulegchOnooson;
    let niitOnooson = onoosonVal;
    
    if (uilchluulegchOnooson != null) {
      niitOnooson = (onoosonVal + uilchluulegchOnooson) / 2;
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      {
        $set: {
          onooson:       onoosonVal,  
          onoosonTailbar: onoosonTailbar || "",
          onoosonOgnoo:   new Date(),
          onoosonAdminId: adminId,
          niitOnooson: niitOnooson
        }
      },
      { new: true }
    ).lean();

    const usersToUpdate = new Set<string>();
    if (task.hariutsagchId) usersToUpdate.add(task.hariutsagchId);
    if (Array.isArray(task.ajiltnuud)) {
      task.ajiltnuud.forEach((id: string) => usersToUpdate.add(id));
    }

    let lastKpiResult = null;
    const { getIO } = require("../utils/socket");
    const { medegdelUusgekh }: any = require("../services/medegdelService");

    for (const userId of usersToUpdate) {
      try {
        const kpiResult = await kpiShineelekh(userId, task.baiguullagiinId);
        console.log(`[KPI] Recalculated for user ${userId}:`, kpiResult);
        lastKpiResult = kpiResult;

        const notification = await medegdelUusgekh({
          ajiltniiId:      userId,
          baiguullagiinId: task.baiguullagiinId,
          barilgiinId:     task.barilgiinId,
          projectId:       task.projectId,
          taskId:          task._id.toString(),
          turul:           "taskCompleted",
          title:           "Оноо авлаа 🎯",
          message:         `${task.ner} даалгаварт ${points}/10 оноо авлаа${onoosonTailbar ? ": " + onoosonTailbar : ""}`,
          object:          updatedTask
        });
        emitToRoom(`user_${userId}`, "new_notification", notification);

        emitToRoom(`baiguullaga_${task.baiguullagiinId}`, "kpi_updated", {
          userId: userId,
          ...kpiResult
        });
      } catch (err) {
        console.error(`[KPI/Notification] Failed to process updates for user ${userId}:`, err);
      }
    }

    emitToRoom(`project_${task.projectId}`, "task_updated", updatedTask);
    emitToRoom(`task_${task._id}`, "task_updated", updatedTask);

    res.json({
      success: true,
      message: `Оноо амжилттай хадгалагдлаа (${points}/10)`,
      data: updatedTask,
      kpi: lastKpiResult
    });
  } catch (err) {
    next(err);
  }
};

export const giveClientTaskPoints = async (req: any, res: Response, next: any) => {
  try {
    const taskId   = req.params.id;
    const { uilchluulegchOnooson, uilchluulegchOnoosonTailbar, uilchluulegchId } = req.body;

    if (uilchluulegchOnooson === undefined || uilchluulegchOnooson === null) {
      return res.status(400).json({ success: false, message: "Оноо заавал бөглөнө" });
    }
    const points = Number(uilchluulegchOnooson);
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
        message: "Оноо өгөхийн тулд даалгавар дууссан байх ёстой"
      });
    }

    const { getConn } = require("../utils/db");
    const getTaskModel = require("../models/task");
    const conn      = getConn();
    const TaskModel = getTaskModel(conn, true);

    const uilchOnoosonVal = Math.round(points * 10) / 10;
    const adminOnooson = task.onooson;
    let niitOnooson = uilchOnoosonVal;
    
    if (adminOnooson != null) {
      niitOnooson = (adminOnooson + uilchOnoosonVal) / 2;
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      {
        $set: {
          uilchluulegchOnooson:       uilchOnoosonVal,  
          uilchluulegchOnoosonTailbar: uilchluulegchOnoosonTailbar || "",
          uilchluulegchOnoosonOgnoo:   new Date(),
          uilchluulegchId: uilchluulegchId,
          niitOnooson: niitOnooson
        }
      },
      { new: true }
    ).lean();

    const usersToUpdate = new Set<string>();
    if (task.hariutsagchId) usersToUpdate.add(task.hariutsagchId);
    if (Array.isArray(task.ajiltnuud)) {
      task.ajiltnuud.forEach((id: string) => usersToUpdate.add(id));
    }

    let lastKpiResult = null;
    const { getIO } = require("../utils/socket");
    const { medegdelUusgekh }: any = require("../services/medegdelService");

    for (const userId of usersToUpdate) {
      try {
        const kpiResult = await kpiShineelekh(userId, task.baiguullagiinId);
        lastKpiResult = kpiResult;

        const notification = await medegdelUusgekh({
          ajiltniiId:      userId,
          baiguullagiinId: task.baiguullagiinId,
          barilgiinId:     task.barilgiinId,
          projectId:       task.projectId,
          taskId:          task._id.toString(),
          turul:           "taskCompleted",
          title:           "Үйлчлүүлэгчээс оноо авлаа 🎯",
          message:         `${task.ner} даалгаварт үйлчлүүлэгчээс ${points}/10 оноо авлаа${uilchluulegchOnoosonTailbar ? ": " + uilchluulegchOnoosonTailbar : ""}`,
          object:          updatedTask
        });
        emitToRoom(`user_${userId}`, "new_notification", notification);

        emitToRoom(`baiguullaga_${task.baiguullagiinId}`, "kpi_updated", {
          userId: userId,
          ...kpiResult
        });
      } catch (err) {
        console.error(`[KPI/Notification] Failed to process updates for user ${userId}:`, err);
      }
    }

    emitToRoom(`project_${task.projectId}`, "task_updated", updatedTask);
    emitToRoom(`task_${task._id}`, "task_updated", updatedTask);

    // Update client KPI
    let clientKpi = null;
    const finalClientId = uilchluulegchId || task.uilchluulegchId;
    if (finalClientId) {
      try {
        clientKpi = await kpiShineelekhUilchluulegch(finalClientId);
        
        // Emit to barilga room
        if (task.barilgiinId) {
          emitToRoom(`barilga_${task.barilgiinId}`, "client_kpi_updated", {
            uilchluulegchId: finalClientId,
            ...clientKpi
          });
        }
      } catch (err) {
        console.error(`[KPI/Client] Failed to update stats for client ${finalClientId}:`, err);
      }
    }

    res.json({
      success: true,
      message: `Үйлчлүүлэгчийн оноо хадгалагдлаа (${points}/10)`,
      data: updatedTask,
      kpi: lastKpiResult,
      clientKpi: clientKpi
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
        onoosonAdminId:  task.onoosonAdminId ?? null,

        uilchluulegchOnooson:          task.uilchluulegchOnooson ?? null,
        uilchluulegchOnoosonTailbar:   task.uilchluulegchOnoosonTailbar ?? "",
        uilchluulegchOnoosonOgnoo:     task.uilchluulegchOnoosonOgnoo ?? null,
        uilchluulegchId:               task.uilchluulegchId ?? null,

        niitOnooson: task.niitOnooson ?? task.onooson ?? task.uilchluulegchOnooson ?? null
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
    emitToRoom(`baiguullaga_${(user as any).baiguullagiinId}`, "kpi_updated", {
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
    const { getCol } = require("../utils/db");
    const { ObjectId } = require("mongodb");
    const ajiltanCol = getCol("ajiltan");

    let idQuery: any[] = [baiguullagiinId, baiguullagiinId.toString()];
    try {
      if (ObjectId.isValid(baiguullagiinId)) {
        idQuery.push(new ObjectId(baiguullagiinId));
      }
    } catch (e) {}

    const query = { 
      $or: [
        { baiguullagiinId: { $in: idQuery } },
        { baiguullagaId: { $in: idQuery } },
        { baiguullaga: { $in: idQuery } },
        { "baiguullaga.id": { $in: idQuery } }
      ]
    };

    const users = await ajiltanCol.find(query).toArray();
    
    // Debug info if empty
    if (users.length === 0) {
      const totalWorkers = await ajiltanCol.countDocuments({});
      const sampleWorker = await ajiltanCol.findOne({});
      return res.json({ 
        success: true, 
        data: [], 
        debug: { 
          queriedId: baiguullagiinId, 
          idQuery: idQuery.map(q => q.toString()), 
          totalWorkersInDB: totalWorkers,
          sampleWorkerFields: sampleWorker ? Object.keys(sampleWorker) : "none",
          sampleWorkerOrgId: sampleWorker ? (sampleWorker.baiguullagiinId || sampleWorker.baiguullagaId || sampleWorker.baiguullaga) : "none"
        } 
      });
    }

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const refreshBaiguullagaKpis = async (req: any, res: Response, next: any) => {
  try {
    const { id: baiguullagiinId } = req.params;
    const { getCol } = require("../utils/db");
    const { ObjectId } = require("mongodb");
    const ajiltanCol = getCol("ajiltan");

    let idQuery: any[] = [baiguullagiinId, baiguullagiinId.toString()];
    try {
      if (ObjectId.isValid(baiguullagiinId)) {
        idQuery.push(new ObjectId(baiguullagiinId));
      }
    } catch (e) {}

    const query = { 
      $or: [
        { baiguullagiinId: { $in: idQuery } },
        { baiguullagaId: { $in: idQuery } },
        { baiguullaga: { $in: idQuery } },
        { "baiguullaga.id": { $in: idQuery } }
      ]
    };

    const users = await ajiltanCol.find(query).toArray();
    
    if (users.length === 0) {
      const totalWorkers = await ajiltanCol.countDocuments({});
      const sampleWorker = await ajiltanCol.findOne({});
      return res.json({
        success: true,
        message: "0 ажилтны KPI амжилттай шинэчлэгдлээ",
        count: 0,
        debug: {
          queriedId: baiguullagiinId,
          totalWorkersInDB: totalWorkers,
          sampleWorkerOrgId: sampleWorker ? (sampleWorker.baiguullagiinId || sampleWorker.baiguullagaId || sampleWorker.baiguullaga) : "none"
        }
      });
    }
    
    const results = [];
    for (const user of users) {
      const userId = user._id.toString();
      const stats = await kpiShineelekh(userId, baiguullagiinId);
      results.push({ userId, stats });
      
      // Emit update to the organization room
      emitToRoom(`baiguullaga_${baiguullagiinId}`, "kpi_updated", {
        userId: userId,
        ...stats
      });
    }

    res.json({ 
      success: true, 
      message: `${results.length} ажилтны KPI амжилттай шинэчлэгдлээ`, 
      count: results.length 
    });
  } catch (err) {
    next(err);
  }
};
