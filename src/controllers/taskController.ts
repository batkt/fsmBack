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
    if (bid) query.baiguullagiinId = bid;

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
    const bid = req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId;
    const data = {
      ...req.body,
      ...(bid && { baiguullagiinId: bid })
    };
    const task = await taskUusgekh(data);
    
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
    });

    // Notify project room and task room
    emitToRoom(`project_${task.projectId}`, "new_message", initialMessage);
    emitToRoom(`task_${task._id}`, "new_message", initialMessage);
    
    // Emit task creation event to project and task rooms
    emitToRoom(`project_${task.projectId}`, "task_created", task);
    emitToRoom(`task_${task._id}`, "task_created", task);

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
        });
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
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: any, res: Response, next: any) => {
  try {
    // Get old task BEFORE update to compare changes
    const oldTask = await taskNegAvakh(req.params.id);
    if (!oldTask) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });

    // Update the task
    const task = await taskZasakh(req.params.id, req.body);
    if (!task) return res.status(404).json({ success: false, message: "Даалгавар олдсонгүй" });

    // Emit task update event
    const { emitToRoom }: any = require("../utils/socket");
    emitToRoom(`project_${task.projectId}`, "task_updated", task);
    emitToRoom(`task_${task._id}`, "task_updated", task);

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
        });
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

    if (membersToNotify.size === 0) {
      console.warn("[Task Update] ⚠️ No members to notify (all members are the updater or no members found)");
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
    });

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

    const { _id: delTaskId, ...delTaskData } = existing;
    await taskTuukhUusgekh({
      ...delTaskData,
      sourceTaskId: existing._id,
      taskCode: existing.taskId,
      duussanOgnoo: new Date(),
      ajiltniiId: req.ajiltan?.id,
      ajiltniiNer: req.ajiltan?.ner,
      uildel: "deleted"
    });

    await taskUstgakh(req.params.id);
    res.json({ success: true, message: "Даалгавар амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
