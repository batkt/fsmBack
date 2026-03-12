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
    
    // Filter by FSM authorized baiguullagiinIds
    const authorizedIds = req.fsmAuthorizedIds || [];
    if (authorizedIds.length > 0) {
      if (bid && authorizedIds.includes(bid)) {
        query.baiguullagiinId = bid;
      } else if (!bid) {
        // If no specific bid requested, only show authorized companies
        query.baiguullagiinId = { $in: authorizedIds };
      } else {
        // Requested bid is not authorized, return empty
        return res.json({ success: true, data: [] });
      }
    } else if (bid) {
      query.baiguullagiinId = bid;
    }

    if (req.query.projectId) query.projectId = req.query.projectId;
    if (req.query.tuluv) query.tuluv = req.query.tuluv;
    if (req.query.zereglel) query.zereglel = req.query.zereglel;
    if (req.query.hariutsagchId) query.hariutsagchId = req.query.hariutsagchId;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;
    if (req.query.uilchluulegchId) {
      const { getConn } = require("../utils/db");
      const getProjectModel = require("../models/project");
      const conn = req.body.tukhainBaaziinKholbolt || getConn();
      const ProjectModel = getProjectModel(conn, true);
      const projects = await ProjectModel.find({ uilchluulegchId: req.query.uilchluulegchId }).select("_id").lean();
      const pIds = projects.map((p: any) => p._id.toString());
      
      query.$or = [
        { uilchluulegchId: req.query.uilchluulegchId },
        { projectId: { $in: pIds } }
      ];
    }


    const tasks = await taskJagsaalt(query, req.body.tukhainBaaziinKholbolt);
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

export const getTask = async (req: any, res: Response, next: any) => {
  try {
    const task = await taskNegAvakh(req.params.id, req.body.tukhainBaaziinKholbolt);
    if (!task) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });
    
    // Check if task's baiguullagiinId has FSM access
    const authorizedIds = req.fsmAuthorizedIds || [];
    if (authorizedIds.length > 0 && task.baiguullagiinId && !authorizedIds.includes(task.baiguullagiinId)) {
      return res.status(403).json({ success: false, message: "Даалгавар олдсонгүй" });
    }
    
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req: any, res: Response, next: any) => {
  try {
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId || req.validatedBaiguullagiinId;
    const uploaderId = req.ajiltan?.id;
    const isHariutsagch = req.body.hariutsagchId === uploaderId;
    
    // Prepare data with automatic ajiltniiId for images
    const data: any = {
      ...req.body,
      ...(bid && { baiguullagiinId: bid })
    };

    // Automatically set ajiltniiId for hariutsagchZurag images if creator is hariutsagch
    if (data.hariutsagchZurag && Array.isArray(data.hariutsagchZurag) && isHariutsagch && uploaderId) {
      data.hariutsagchZurag = data.hariutsagchZurag.map((img: any) => ({
        ...img,
        ajiltniiId: img.ajiltniiId || uploaderId,
        ajiltniiNer: img.ajiltniiNer || req.ajiltan?.ner,
        ognoo: img.ogno || new Date(),
        // Preserve tailbar and garchig if provided
        tailbar: img.tailbar || img.text || img.description,
        garchig: img.garchig || img.title
      }));
    }

    // Automatically set ajiltniiId for ajiltanZurag images
    if (data.ajiltanZurag && Array.isArray(data.ajiltanZurag) && uploaderId) {
      data.ajiltanZurag = data.ajiltanZurag.map((img: any) => ({
        ...img,
        ajiltniiId: img.ajiltniiId || uploaderId,
        ajiltniiNer: img.ajiltniiNer || req.ajiltan?.ner,
        ognoo: img.ogno || new Date(),
        // Preserve tailbar and garchig if provided
        tailbar: img.tailbar || img.text || img.description,
        garchig: img.garchig || img.title
      }));
    }

    const task = await taskUusgekh(data, req.body.tukhainBaaziinKholbolt);
    
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
    }, req.body.tukhainBaaziinKholbolt);

    // Notify project room and task room
    emitToRoom(`project_${task.projectId}`, "new_message", initialMessage);
    emitToRoom(`task_${task._id}`, "new_message", initialMessage);
    
    // Emit task creation event to project and task rooms
    emitToRoom(`project_${task.projectId}`, "task_created", task);
    emitToRoom(`task_${task._id}`, "task_created", task);
    emitToRoom(`barilga_${task.barilgiinId}`, "task_created", task);

    // Create notifications for all task members (assigned user + ajiltnuud, except creator)
    const { medegdelUusgekh }: any = require("../services/medegdelService");
    const creatorId = req.ajiltan?.id;
    const membersToNotify = new Set<string>();

    console.log("[Task Creation] Creating notifications:", {
      creatorId: creatorId,
      hariutsagchId: task.hariutsagchId,
      ajiltnuud: task.ajiltnuud
    });

    // Add assigned user
    if (task.hariutsagchId && task.hariutsagchId !== creatorId) {
      membersToNotify.add(task.hariutsagchId);
      console.log("[Task Creation] Added hariutsagchId to notify:", task.hariutsagchId);
    }

    // Add task members from ajiltnuud array
    if (task.ajiltnuud && Array.isArray(task.ajiltnuud)) {
      task.ajiltnuud.forEach((id: string) => {
        if (id !== creatorId) {
          membersToNotify.add(id);
          console.log("[Task Creation] Added ajiltnuud member to notify:", id);
        } else {
          console.log("[Task Creation] Skipped creator from notifications:", id);
        }
      });
    }

    console.log("[Task Creation] Total members to notify:", membersToNotify.size, Array.from(membersToNotify));

    // Create notifications for all members
    for (const memberId of membersToNotify) {
      try {
        console.log("[Task Creation] Creating notification for user:", memberId);
        const notification = await medegdelUusgekh({
          ajiltniiId: memberId,
          baiguullagiinId: task.baiguullagiinId,
          barilgiinId: task.barilgiinId,
          projectId: task.projectId,
          taskId: task._id.toString(),
          turul: "taskCreated",
          title: "Шинэ даалгавар",
          message: `${task.ner} (${task.taskId}) даалгавар танд хуваарилагдлаа`,
          object: task,
          ajiltnuud: task.ajiltnuud || [] // Store task members for filtering
        }, req.body.tukhainBaaziinKholbolt);
        console.log("[Task Creation] ✅ Notification created:", {
          notificationId: notification._id,
          userId: memberId,
          room: `user_${memberId}`
        });
        emitToRoom(`user_${memberId}`, "new_notification", notification);
        console.log("[Task Creation] 📤 Emitted notification to room:", `user_${memberId}`);
      } catch (notifError) {
        // Don't fail the task creation if notification creation fails
        console.error("[Task Creation] ❌ Failed to create notification for user:", memberId, notifError);
      }
    }

    if (membersToNotify.size === 0) {
      console.warn("[Task Creation] ⚠️ No members to notify (all members are the creator or no members found)");
    }

    // Log history
    const { _id: taskObjId, ...taskData } = task.toObject();
    await taskTuukhUusgekh({
      ...taskData,
      sourceTaskId: task._id,
      taskCode: task.taskId,
      ajiltniiId: req.ajiltan?.id,
      ajiltniiNer: req.ajiltan?.ner,
      uildel: "created"
    }, req.body.tukhainBaaziinKholbolt);


    // Refresh client KPI if assignment exists
    if (task.uilchluulegchId) {
      try {
        const { kpiShineelekhUilchluulegch } = require("../services/kpiService");
        const stats = await kpiShineelekhUilchluulegch(task.uilchluulegchId, req.body.tukhainBaaziinKholbolt);
        
        const { emitToRoom } = require("../utils/socket");
        emitToRoom(`barilga_${task.barilgiinId}`, "client_kpi_updated", {
          uilchluulegchId: task.uilchluulegchId,
          ...stats
        });
      } catch (err) {
        console.error("Failed to refresh client KPI:", err);
      }
    }

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: any, res: Response, next: any) => {
  try {
    // Get old task BEFORE update to compare changes
    const oldTask = await taskNegAvakh(req.params.id, req.body.tukhainBaaziinKholbolt);
    if (!oldTask) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });

    // Update the task
    const task = await taskZasakh(req.params.id, req.body, req.body.tukhainBaaziinKholbolt);
    if (!task) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });

    // Emit task update event
    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom(`project_${task.projectId}`, "task_updated", task);
    emitToRoom(`task_${task._id}`, "task_updated", task);
    emitToRoom(`barilga_${task.barilgiinId}`, "task_updated", task);

    // Create notifications for task members (except updater)
    const { medegdelUusgekh }: any = require("../services/medegdelService");
    const updaterId = req.ajiltan?.id;
    const membersToNotify = new Set<string>();

    console.log("[Task Update] Creating notifications:", {
      updaterId: updaterId,
      hariutsagchId: task.hariutsagchId,
      ajiltnuud: task.ajiltnuud,
      oldStatus: oldTask.tuluv,
      newStatus: task.tuluv
    });

    // Add assigned user
    if (task.hariutsagchId && task.hariutsagchId !== updaterId) {
      membersToNotify.add(task.hariutsagchId);
      console.log("[Task Update] Added hariutsagchId to notify:", task.hariutsagchId);
    }

    // Add task members
    if (task.ajiltnuud && Array.isArray(task.ajiltnuud)) {
      task.ajiltnuud.forEach((id: string) => {
        if (id !== updaterId) {
          membersToNotify.add(id);
          console.log("[Task Update] Added ajiltnuud member to notify:", id);
        } else {
          console.log("[Task Update] Skipped updater from notifications:", id);
        }
      });
    }

    console.log("[Task Update] Total members to notify:", membersToNotify.size, Array.from(membersToNotify));

    // Always send notifications for ANY update (manual or automatic)
    // Determine notification type and message based on what changed
    let turul = "taskUpdated";
    let title = "Даалгавар шинэчлэгдлээ";
    let message = `${task.ner} (${task.taskId}) даалгавар шинэчлэгдлээ`;

    // Check if status (tuluv) changed
    const oldStatus = oldTask.tuluv;
    const newStatus = task.tuluv;
    
    if (oldStatus !== newStatus) {
      if (newStatus === "duussan") {
        turul = "taskCompleted";
        title = "Даалгавар дууссан";
        message = `${task.ner} (${task.taskId}) даалгавар амжилттай дууссан`;
      } else if (newStatus === "khiigdej bui") {
        turul = "taskStarted";
        title = "Даалгавар эхэллээ";
        message = `${task.ner} (${task.taskId}) даалгавар эхэлсэн`;
      } else if (newStatus === "khugatsaa khetersen") {
        turul = "taskExpired";
        title = "Даалгавар хугацаа хэтэрсэн";
        message = `${task.ner} (${task.taskId}) даалгаврын хугацаа хэтэрлээ`;
      } else if (newStatus === "shine") {
        turul = "taskReset";
        title = "Даалгавар дахин эхлүүлсэн";
        message = `${task.ner} (${task.taskId}) даалгавар дахин шинэ төлөвт шилжлээ`;
      }
    }
    
    // Check if assignment changed
    if (oldTask.hariutsagchId && task.hariutsagchId !== oldTask.hariutsagchId) {
      turul = "taskAssigned";
      title = "Даалгавар хуваарилагдлаа";
      message = `${task.ner} (${task.taskId}) даалгавар танд хуваарилагдлаа`;
    }

    // Create notifications for all members
    for (const memberId of membersToNotify) {
      try {
        console.log("[Task Update] Creating notification for user:", memberId);
        const notification = await medegdelUusgekh({
          ajiltniiId: memberId,
          baiguullagiinId: task.baiguullagiinId,
          barilgiinId: task.barilgiinId,
          projectId: task.projectId,
          taskId: task._id.toString(),
          turul: turul,
          title: title,
          message: message,
          object: task,
          ajiltnuud: task.ajiltnuud || [] // Store task members for filtering
        }, req.body.tukhainBaaziinKholbolt);
        console.log("[Task Update] ✅ Notification created:", {
          notificationId: notification._id,
          userId: memberId,
          room: `user_${memberId}`,
          turul: turul
        });
        emitToRoom(`user_${memberId}`, "new_notification", notification);
        console.log("[Task Update] 📤 Emitted notification to room:", `user_${memberId}`);
      } catch (notifError) {
        // Don't fail the task update if notification creation fails
        console.error("[Task Update] ❌ Failed to create notification for user:", memberId, notifError);
      }
    }

    // Log history
    let action = "updated";
    if (req.body.tuluv === "duussan") action = "completed";

    const { _id: updTaskId, ...updTaskData } = task;
    await taskTuukhUusgekh({
      ...updTaskData,
      sourceTaskId: task._id,
      taskCode: task.taskId,
      ajiltniiId: req.ajiltan?.id,
      ajiltniiNer: req.ajiltan?.ner,
      uildel: action
    }, req.body.tukhainBaaziinKholbolt);

    // Refresh client KPI if status changed or client exists
    if (task.uilchluulegchId || oldTask.uilchluulegchId) {
      try {
        const { kpiShineelekhUilchluulegch } = require("../services/kpiService");
        const { emitToRoom } = require("../utils/socket");

        if (task.uilchluulegchId) {
          const stats = await kpiShineelekhUilchluulegch(task.uilchluulegchId, req.body.tukhainBaaziinKholbolt);
          emitToRoom(`barilga_${task.barilgiinId}`, "client_kpi_updated", {
            uilchluulegchId: task.uilchluulegchId,
            ...stats
          });
        }
        if (oldTask.uilchluulegchId && oldTask.uilchluulegchId !== task.uilchluulegchId) {
           const stats = await kpiShineelekhUilchluulegch(oldTask.uilchluulegchId, req.body.tukhainBaaziinKholbolt);
           emitToRoom(`barilga_${task.barilgiinId}`, "client_kpi_updated", {
             uilchluulegchId: oldTask.uilchluulegchId,
             ...stats
           });
        }
      } catch (err) {
        console.error("Failed to refresh client KPI:", err);
      }
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: any, res: Response, next: any) => {
  try {
    // Save to history before deleting
    const existing = await taskNegAvakh(req.params.id, req.body.tukhainBaaziinKholbolt);
    if (!existing) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });

    const { _id: delTaskId, ...delTaskData } = existing;
    await taskTuukhUusgekh({
      ...delTaskData,
      sourceTaskId: existing._id,
      taskCode: existing.taskId,
      duussanOgnoo: new Date(),
      ajiltniiId: req.ajiltan?.id,
      ajiltniiNer: req.ajiltan?.ner,
      uildel: "deleted"
    }, req.body.tukhainBaaziinKholbolt);

    await taskUstgakh(req.params.id, req.body.tukhainBaaziinKholbolt);

    // Refresh worker KPIs
    const workersToUpdate = new Set<string>();
    if (existing.hariutsagchId) workersToUpdate.add(existing.hariutsagchId);
    if (existing.ajiltnuud && Array.isArray(existing.ajiltnuud)) {
      existing.ajiltnuud.forEach((id: string) => workersToUpdate.add(id));
    }

    const { kpiShineelekh, kpiShineelekhUilchluulegch } = require("../services/kpiService");
    const { emitToRoom } = require("../utils/socket");

    for (const workerId of workersToUpdate) {
      try {
        const stats = await kpiShineelekh(workerId, existing.baiguullagiinId, req.body.tukhainBaaziinKholbolt);
        emitToRoom(`baiguullaga_${existing.baiguullagiinId}`, "kpi_updated", {
          userId: workerId,
          ...stats
        });
      } catch (err) {
        console.error(`Failed to refresh worker KPI for ${workerId}:`, err);
      }
    }

    // Refresh client KPI if assignment existed
    if (existing.uilchluulegchId) {
      try {
        const stats = await kpiShineelekhUilchluulegch(existing.uilchluulegchId, req.body.tukhainBaaziinKholbolt);
        emitToRoom(`barilga_${existing.barilgiinId}`, "client_kpi_updated", {
          uilchluulegchId: existing.uilchluulegchId,
          ...stats
        });
      } catch (err) {
        console.error("Failed to refresh client KPI:", err);
      }
    }

    res.json({ success: true, message: "Даалгавар амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};

export const uploadTaskImage = async (req: any, res: Response, next: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Файл олдсонгүй" });
    }

    const taskId = req.params.id;
    const uploaderId = req.ajiltan?.id;
    
    if (!uploaderId) {
      return res.status(400).json({ success: false, message: "Хэрэглэгчийн мэдээлэл олдсонгүй" });
    }

    // Get the task
    const task = await taskNegAvakh(taskId, req.body.tukhainBaaziinKholbolt);
    if (!task) {
      return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });
    }

    // Get text/title/description from request body
    const { tailbar, garchig, text, title, description } = req.body;
    
    // Prepare image data
    const imageData: any = {
      zamNer: `uploads/${req.file.filename}`,
      fileNer: req.file.originalname,
      khemjee: req.file.size,
      turul: req.file.mimetype,
      ognoo: new Date(),
      ajiltniiId: uploaderId,
      ajiltniiNer: req.ajiltan?.ner
    };

    // Add text/description (support multiple field names for flexibility)
    if (tailbar || text || description) {
      imageData.tailbar = tailbar || text || description;
    }

    // Add title (support multiple field names for flexibility)
    if (garchig || title) {
      imageData.garchig = garchig || title;
    }

    // Determine if uploader is hariutsagch or ajiltan
    const isHariutsagch = task.hariutsagchId === uploaderId;
    const isAjiltan = task.ajiltnuud && task.ajiltnuud.includes(uploaderId);

    const { getConn } = require("../utils/db");
    const getTaskModel = require("../models/task");
    const conn = req.body.tukhainBaaziinKholbolt || getConn();
    const TaskModel = getTaskModel(conn, true);

    let updateQuery: any = {};

    if (isHariutsagch) {
      // Add to hariutsagchZurag array
      updateQuery.$push = { hariutsagchZurag: imageData };
      console.log(`[Task Image Upload] Adding image to hariutsagchZurag for task ${task.taskId}`);
    } else if (isAjiltan) {
      // Add to ajiltanZurag array
      updateQuery.$push = { ajiltanZurag: imageData };
      console.log(`[Task Image Upload] Adding image to ajiltanZurag for task ${task.taskId}`);
    } else {
      // If user is neither hariutsagch nor in ajiltnuud, add to ajiltanZurag by default
      // (or you could return an error - depends on your business logic)
      updateQuery.$push = { ajiltanZurag: imageData };
      console.log(`[Task Image Upload] User is not hariutsagch or ajiltan, adding to ajiltanZurag by default`);
    }

    // Update the task
    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      updateQuery,
      { new: true }
    ).lean();

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });
    }

    // Emit Socket.IO events
    const { emitToRoom } = require("../utils/socket");
    // Only emit task_updated on the task-specific room (for the open detail modal).
    // Do NOT emit to project/barilga rooms — that would overwrite ajiltanTsag timer
    // data on other clients with a stale snapshot (image upload doesn't touch timers).
    emitToRoom(`task_${updatedTask._id}`, "task_updated", updatedTask);
    
    // Broadcast the image specifically to project and building rooms
    const imgPayload = {
      taskId: updatedTask._id,
      image: imageData,
      uploaderId: uploaderId,
      type: isHariutsagch ? "hariutsagch" : "ajiltan"
    };
    emitToRoom(`task_${updatedTask._id}`, "task_image_uploaded", imgPayload);
    emitToRoom(`project_${updatedTask.projectId}`, "task_image_uploaded", imgPayload);
    emitToRoom(`barilga_${updatedTask.barilgiinId}`, "task_image_uploaded", imgPayload);

    res.json({
      success: true,
      message: "Зураг амжилттай хадгалагдлаа",
      data: updatedTask,
      image: imageData,
      addedTo: isHariutsagch ? "hariutsagchZurag" : "ajiltanZurag"
    });
  } catch (err) {
    next(err);
  }
};

export const startTaskTime = async (req: any, res: Response, next: any) => {
  try {
    const taskId = req.params.id;
    const ajiltniiId = req.ajiltan?.id;
    
    if (!ajiltniiId) {
      return res.status(400).json({ success: false, message: "Ажилтны мэдээлэл олдсонгүй" });
    }

    const { startTaskTime: startTimeService } = require("../services/taskService");
    const { tailbar } = req.body || {};
    
    const result = await startTimeService(taskId, ajiltniiId, tailbar, req.body.tukhainBaaziinKholbolt);

    // Emit Socket.IO event
    const { emitToRoom } = require("../utils/socket");
    emitToRoom(`project_${result.task.projectId}`, "task_updated", result.task);
    emitToRoom(`task_${result.task._id}`, "task_updated", result.task);
    emitToRoom(`barilga_${result.task.barilgiinId}`, "task_updated", result.task);
    
    const timePayload = {
      taskId: result.task._id,
      ajiltniiId: ajiltniiId,
      timeEntry: result.timeEntry
    };
    emitToRoom(`task_${result.task._id}`, "task_time_started", timePayload);
    emitToRoom(`barilga_${result.task.barilgiinId}`, "task_time_started", timePayload);

    res.json({
      success: true,
      message: result.message,
      data: result.task,
      timeEntry: result.timeEntry
    });
  } catch (err: any) {
    if (err.message === "Даалгавар олдсонгүй") {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message.includes("цаг тоолж эхэлсэн")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

export const endTaskTime = async (req: any, res: Response, next: any) => {
  try {
    const taskId = req.params.id;
    const ajiltniiId = req.ajiltan?.id;
    
    if (!ajiltniiId) {
      return res.status(400).json({ success: false, message: "Ажилтны мэдээлэл олдсонгүй" });
    }

    const { endTaskTime: endTimeService } = require("../services/taskService");
    const { tailbar } = req.body || {};
    
    const result = await endTimeService(taskId, ajiltniiId, tailbar, req.body.tukhainBaaziinKholbolt);

    // Emit Socket.IO event
    const { emitToRoom } = require("../utils/socket");
    emitToRoom(`project_${result.task.projectId}`, "task_updated", result.task);
    emitToRoom(`task_${result.task._id}`, "task_updated", result.task);
    emitToRoom(`barilga_${result.task.barilgiinId}`, "task_updated", result.task);
    
    const endPayload = {
      taskId: result.task._id,
      ajiltniiId: ajiltniiId,
      timeEntry: result.timeEntry,
      durationMinutes: result.durationMinutes
    };
    emitToRoom(`task_${result.task._id}`, "task_time_ended", endPayload);
    emitToRoom(`barilga_${result.task.barilgiinId}`, "task_time_ended", endPayload);

    res.json({
      success: true,
      message: result.message,
      data: result.task,
      timeEntry: result.timeEntry,
      durationMinutes: result.durationMinutes
    });
  } catch (err: any) {
    if (err.message === "Даалгавар олдсонгүй") {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message.includes("цаг тоолж эхлээгүй")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};
