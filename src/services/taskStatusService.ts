import { getConn } from "../utils/db";

const getTaskModel = require("../models/task");

/**
 * Automatically update task status based on time
 * - When ekhlekhTsag arrives → change to "khiigdej bui" (active)
 * - When khugatsaaDuusakhOgnoo passes → change to "khugatsaa khetersen" (expired)
 * - Only updates tasks that are not already "duussan" (completed)
 */
export const updateTaskStatusesByTime = async () => {
  const conn = getConn();
  const Task = getTaskModel(conn, true); // Use FSM database

  const now = new Date();
  const updatedTasks: any[] = [];

  try {
    // Find tasks that should be active (start time has passed but not completed)
    const tasksToActivate = await Task.find({
      tuluv: { $in: ["shine"] }, // Only new tasks
      ekhlekhTsag: { $lte: now }, // Start time has passed
      duusakhTsag: { $exists: true, $ne: null } // Has end time
    }).lean();

    // Activate tasks
    for (const task of tasksToActivate) {
      await Task.findByIdAndUpdate(task._id, {
        $set: { tuluv: "khiigdej bui" }
      });
      updatedTasks.push({ taskId: task._id, action: "activated", oldStatus: task.tuluv, newStatus: "khiigdej bui" });
      console.log(`[Task Status] ✅ Task ${task.taskId} (${task.ner}) activated - start time reached`);
    }

    // Find tasks that should be expired (deadline passed but not completed)
    const tasksToExpire = await Task.find({
      tuluv: { $nin: ["duussan", "khugatsaa khetersen"] }, // Not already completed or expired
      khugatsaaDuusakhOgnoo: { $lt: now, $exists: true, $ne: null } // Deadline has passed and exists
    }).lean();

    // Expire tasks
    for (const task of tasksToExpire) {
      await Task.findByIdAndUpdate(task._id, {
        $set: { tuluv: "khugatsaa khetersen" }
      });
      updatedTasks.push({ taskId: task._id, action: "expired", oldStatus: task.tuluv, newStatus: "khugatsaa khetersen" });
      console.log(`[Task Status] ⏰ Task ${task.taskId} (${task.ner}) expired - deadline passed`);
    }

    if (updatedTasks.length > 0) {
      console.log(`[Task Status] 📊 Updated ${updatedTasks.length} task(s) based on time`);
      
      // Emit Socket.IO events and create notifications for updated tasks
      const { emitToRoom } = require("../utils/socket");
      const { medegdelUusgekh } = require("../services/medegdelService");
      
      for (const update of updatedTasks) {
        const task = await Task.findById(update.taskId).lean();
        if (task) {
          // Emit Socket.IO events
          emitToRoom(`project_${task.projectId}`, "task_updated", task);
          emitToRoom(`task_${task._id}`, "task_updated", task);

          // Create notifications for all task members
          const membersToNotify = new Set<string>();

          // Add assigned user
          if (task.hariutsagchId) {
            membersToNotify.add(task.hariutsagchId);
          }

          // Add task members
          if (task.ajiltnuud && Array.isArray(task.ajiltnuud)) {
            task.ajiltnuud.forEach((id: string) => {
              membersToNotify.add(id);
            });
          }

          // Determine notification type and message based on status change
          let turul = "taskUpdated";
          let title = "Даалгавар шинэчлэгдлээ";
          let message = `${task.ner} (${task.taskId}) даалгавар шинэчлэгдлээ`;

          if (update.newStatus === "khiigdej bui") {
            turul = "taskStarted";
            title = "Даалгавар эхэллээ";
            message = `${task.ner} (${task.taskId}) даалгавар эхэлсэн цаг ирлээ`;
          } else if (update.newStatus === "khugatsaa khetersen") {
            turul = "taskExpired";
            title = "Даалгавар хугацаа хэтэрсэн";
            message = `${task.ner} (${task.taskId}) даалгаврын хугацаа хэтэрлээ`;
          }

          // Create notifications for all members
          for (const memberId of membersToNotify) {
            try {
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
                ajiltnuud: task.ajiltnuud || []
              });
              emitToRoom(`user_${memberId}`, "new_notification", notification);
              console.log(`[Task Status] ✅ Notification sent to ${memberId} for task ${task.taskId} status change: ${update.oldStatus} → ${update.newStatus}`);
            } catch (notifError) {
              console.error(`[Task Status] ❌ Failed to create notification for user ${memberId}:`, notifError);
            }
          }
        }
      }
    }

    return {
      success: true,
      updated: updatedTasks.length,
      details: updatedTasks
    };
  } catch (error) {
    console.error("[Task Status] ❌ Error updating task statuses:", error);
    throw error;
  }
};

/**
 * Get task status based on current time
 * Returns what the status should be without updating the database
 */
export const getTaskStatusByTime = (task: any): string => {
  const now = new Date();

  // If already completed, return as is
  if (task.tuluv === "duussan") {
    return "duussan";
  }

  // If already expired, return as is
  if (task.tuluv === "khugatsaa khetersen") {
    return "khugatsaa khetersen";
  }

  // Check if deadline has passed
  if (task.khugatsaaDuusakhOgnoo && new Date(task.khugatsaaDuusakhOgnoo) < now) {
    return "khugatsaa khetersen";
  }

  // Check if start time has arrived
  if (task.ekhlekhTsag && new Date(task.ekhlekhTsag) <= now) {
    return "khiigdej bui";
  }

  // Otherwise, return current status
  return task.tuluv || "shine";
};

/**
 * Update a single task's status based on time
 */
export const updateSingleTaskStatus = async (taskId: string) => {
  const conn = getConn();
  const Task = getTaskModel(conn, true);

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return { success: false, message: "Task not found" };
    }

    const currentStatus = task.tuluv;
    const calculatedStatus = getTaskStatusByTime(task);

    if (currentStatus !== calculatedStatus) {
      task.tuluv = calculatedStatus;
      await task.save();

      // Emit Socket.IO events
      const { emitToRoom } = require("../utils/socket");
      emitToRoom(`project_${task.projectId}`, "task_updated", task);
      emitToRoom(`task_${task._id}`, "task_updated", task);

      // Create notifications for all task members
      const { medegdelUusgekh } = require("../services/medegdelService");
      const membersToNotify = new Set<string>();

      // Add assigned user
      if (task.hariutsagchId) {
        membersToNotify.add(task.hariutsagchId);
      }

      // Add task members
      if (task.ajiltnuud && Array.isArray(task.ajiltnuud)) {
        task.ajiltnuud.forEach((id: string) => {
          membersToNotify.add(id);
        });
      }

      // Determine notification type and message
      let turul = "taskUpdated";
      let title = "Даалгавар шинэчлэгдлээ";
      let message = `${task.ner} (${task.taskId}) даалгавар шинэчлэгдлээ`;

      if (calculatedStatus === "khiigdej bui") {
        turul = "taskStarted";
        title = "Даалгавар эхэллээ";
        message = `${task.ner} (${task.taskId}) даалгавар эхэлсэн цаг ирлээ`;
      } else if (calculatedStatus === "khugatsaa khetersen") {
        turul = "taskExpired";
        title = "Даалгавар хугацаа хэтэрсэн";
        message = `${task.ner} (${task.taskId}) даалгаврын хугацаа хэтэрлээ`;
      }

      // Create notifications for all members
      for (const memberId of membersToNotify) {
        try {
          const notification = await medegdelUusgekh({
            ajiltniiId: memberId,
            baiguullagiinId: task.baiguullagiinId,
            barilgiinId: task.barilgiinId,
            projectId: task.projectId,
            taskId: task._id.toString(),
            turul: turul,
            title: title,
            message: message,
            object: task.toObject(),
            ajiltnuud: task.ajiltnuud || []
          });
          emitToRoom(`user_${memberId}`, "new_notification", notification);
          console.log(`[Task Status] ✅ Notification sent to ${memberId} for task ${task.taskId}`);
        } catch (notifError) {
          console.error(`[Task Status] ❌ Failed to create notification for user ${memberId}:`, notifError);
        }
      }

      console.log(`[Task Status] ✅ Task ${task.taskId} status updated: ${currentStatus} → ${calculatedStatus}`);
      
      return {
        success: true,
        oldStatus: currentStatus,
        newStatus: calculatedStatus,
        task: task
      };
    }

    return {
      success: true,
      message: "Status already correct",
      status: currentStatus
    };
  } catch (error) {
    console.error("[Task Status] ❌ Error updating task status:", error);
    throw error;
  }
};
