import { ensureFsmConn } from "../utils/fsmConn";

const getTaskModel = require("../models/task");

/**
 * Automatically update task status based on time
 * - When ekhlekhTsag arrives → change to "khiigdej bui" (active)
 * - When khugatsaaDuusakhOgnoo passes → change to "khugatsaa khetersen" (expired)
 * - Only updates tasks that are not already "duussan" (completed)
 */
export const updateTaskStatusesByTime = async (conn: any) => {
  const baseConn = ensureFsmConn(conn);
  const Task = getTaskModel(baseConn, true); // Use FSM database

  const now = new Date();
  const updatedTasks: any[] = [];

  try {
    const tasksToExpire = await Task.find({
      tuluv: { $nin: ["duussan", "khugatsaa khetersen"] }, // Not already completed or expired
      $or: [
        { khugatsaaDuusakhOgnoo: { $lt: now, $exists: true, $ne: null } },
        { duusakhTsag: { $lt: now, $exists: true, $ne: null }, isLoop: false },
        { duusakhOgnoo: { $lt: now, $exists: true, $ne: null }, isLoop: true }
      ]
    }).lean();

    // Expire tasks
    for (const task of tasksToExpire) {
      // For looping tasks, double check if the current time is past the end of the loop day
      if (task.isLoop && task.duusakhOgnoo) {
        const loopEnd = new Date(task.duusakhOgnoo);
        loopEnd.setHours(23, 59, 59, 999);
        if (loopEnd > now) continue; // Not actually expired yet (still on its last day)
      }

      await Task.findByIdAndUpdate(task._id, {
        $set: { tuluv: "khugatsaa khetersen" }
      });
      updatedTasks.push({ taskId: task._id, action: "expired", oldStatus: task.tuluv, newStatus: "khugatsaa khetersen" });
      console.log(`[Task Status] ⏰ Task ${task.taskId} (${task.ner}) expired`);
    }

    if (updatedTasks.length > 0) {
      console.log(`[Task Status] 📊 Updated ${updatedTasks.length} task(s) based on time`);
      
      const { emitToRoom } = require("../utils/socket");
      const { medegdelUusgekh } = require("../services/medegdelService");
      
      for (const update of updatedTasks) {
        const task = await Task.findById(update.taskId).lean();
        if (task) {
          emitToRoom(`project_${task.projectId}`, "task_updated", task);
          emitToRoom(`task_${task._id}`, "task_updated", task);

          const membersToNotify = new Set<string>();
          if (task.hariutsagchId) membersToNotify.add(task.hariutsagchId);
          if (task.ajiltnuud && Array.isArray(task.ajiltnuud)) {
            task.ajiltnuud.forEach((id: string) => membersToNotify.add(id));
          }

          for (const memberId of membersToNotify) {
            try {
              const notification = await medegdelUusgekh({
                ajiltniiId: memberId,
                baiguullagiinId: task.baiguullagiinId,
                barilgiinId: task.barilgiinId,
                projectId: task.projectId,
                taskId: task._id.toString(),
                turul: "taskExpired",
                title: "Даалгавар хугацаа хэтэрсэн",
                message: `${task.ner} (${task.taskId}) даалгаврын хугацаа хэтэрлээ`,
                object: task,
                ajiltnuud: task.ajiltnuud || []
              }, baseConn);
              emitToRoom(`user_${memberId}`, "new_notification", notification);
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

  // If already expired or in progress, return as is
  if (task.tuluv === "khugatsaa khetersen" || task.tuluv === "khiigdej bui") {
    return task.tuluv;
  }

  // Check if deadline has passed
  let deadline = task.khugatsaaDuusakhOgnoo ? new Date(task.khugatsaaDuusakhOgnoo) : null;
  
  // If we have newer date fields, use them for more precise expiration
  if (task.duusakhTsag && !task.isLoop) {
    deadline = new Date(task.duusakhTsag);
  } else if (task.duusakhOgnoo && task.isLoop) {
    // Looping tasks expire at the end of their last day
    deadline = new Date(task.duusakhOgnoo);
    deadline.setHours(23, 59, 59, 999);
  }

  if (deadline && deadline < now) {
    return "khugatsaa khetersen";
  }

  // Automatically start tasks if start time reached (if desired)
  // if (task.tuluv === "shine" && task.ekhlekhTsag && new Date(task.ekhlekhTsag) <= now) {
  //   return "khiigdej bui";
  // }

  // Otherwise, return current status
  return task.tuluv || "shine";
};

/**
 * Update a single task's status
 * - If newStatus is provided → use that directly (manual change from frontend)
 * - If not provided → calculate based on time (automatic)
 */
export const updateSingleTaskStatus = async (taskId: string, newStatus: string | undefined, ajiltanTsag: any[] | undefined, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  const Task = getTaskModel(baseConn, true);

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return { success: false, message: "Task not found" };
    }

    const currentStatus = task.tuluv;
    const calculatedStatus = getTaskStatusByTime(task);
    const targetStatus = newStatus || calculatedStatus;

    // Check if we have real changes to apply
    if (currentStatus !== targetStatus || (ajiltanTsag && ajiltanTsag.length > 0)) {
      if (currentStatus !== targetStatus) {
        task.tuluv = targetStatus;
      }

      const taskObj = task; 
      
      // Handle completion timestamp
      if (targetStatus === "duussan") {
          taskObj.duussanOgnoo = taskObj.duussanOgnoo || new Date();
      } else if (targetStatus !== "duussan" && targetStatus !== "khugatsaa khetersen") {
          taskObj.duussanOgnoo = null;
      }

      if (!taskObj.ajiltanTsag) taskObj.ajiltanTsag = [];

      // Merge incoming logs from mobile app
      if (ajiltanTsag && Array.isArray(ajiltanTsag)) {
         for (const reqTsag of ajiltanTsag) {
             const employeeId = reqTsag.ajiltniiId;
             if (!employeeId) continue;
             
             // Defensive: skip 0-duration entries (app often sends these when finishing if start is lost)
             const rStart = new Date(reqTsag.ekhlekhTsag);
             const rEnd   = reqTsag.duusakhTsag ? new Date(reqTsag.duusakhTsag) : null;
             if (rEnd && rEnd.getTime() <= rStart.getTime()) {
                console.log(`[Task Status] ⚠️ Skipping 0-duration session for ${employeeId}`);
                continue;
             }

             const openIdx = taskObj.ajiltanTsag.findIndex((t: any) => t.ajiltniiId === employeeId && !t.duusakhTsag);
             
             if (reqTsag.duusakhTsag) {
                 if (openIdx !== -1) {
                     // Close existing open session in DB
                     taskObj.ajiltanTsag[openIdx].duusakhTsag = reqTsag.duusakhTsag;
                     if (reqTsag.tsagMinute) taskObj.ajiltanTsag[openIdx].tsagMinute = reqTsag.tsagMinute;
                     else {
                         const startMs = new Date(taskObj.ajiltanTsag[openIdx].ekhlekhTsag).getTime();
                         taskObj.ajiltanTsag[openIdx].tsagMinute = Math.max(0, Math.round((rEnd!.getTime() - startMs) / 60000));
                     }
                 } else {
                     // Only add as new if we don't have a very recent matching session (prevents duplicates)
                     const hasDuplicate = taskObj.ajiltanTsag.some((t: any) => 
                        t.ajiltniiId === employeeId && t.duusakhTsag && 
                        Math.abs(new Date(t.duusakhTsag).getTime() - rStart.getTime()) < 30000
                     );
                     if (!hasDuplicate) taskObj.ajiltanTsag.push(reqTsag);
                 }
             } else {
                 if (openIdx === -1) taskObj.ajiltanTsag.push(reqTsag);
             }
         }
      }

      // Final pass: ensure all sessions are closed if task is finished
      if (targetStatus === "duussan") {
          const finalEnd = taskObj.duussanOgnoo || new Date();
          taskObj.ajiltanTsag = taskObj.ajiltanTsag.map((entry: any) => {
             if (!entry.duusakhTsag) {
                entry.duusakhTsag = finalEnd;
                const start = new Date(entry.ekhlekhTsag);
                if (!isNaN(start.getTime())) {
                    entry.tsagMinute = Math.max(0, Math.round((finalEnd.getTime() - start.getTime()) / 60000));
                }
             }
             return entry;
          });
      }

      task.markModified("ajiltanTsag");
      await task.save();

      // Broadcast changes via Socket.IO
      const { emitToRoom } = require("../utils/socket");
      emitToRoom(`project_${task.projectId}`, "task_updated", task);
      emitToRoom(`task_${task._id}`, "task_updated", task);
      if (task.barilgiinId) {
        emitToRoom(`barilga_${task.barilgiinId}`, "task_updated", task);
      }

      // Logic for notifications (only on status change)
      if (currentStatus !== targetStatus) {
          const { medegdelUusgekh } = require("../services/medegdelService");
          const membersToNotify = new Set<string>();
          if (task.hariutsagchId) membersToNotify.add(task.hariutsagchId);
          if (task.ajiltnuud && Array.isArray(task.ajiltnuud)) {
            task.ajiltnuud.forEach((id: string) => membersToNotify.add(id));
          }

          let turul = "taskUpdated";
          let title = "Даалгавар шинэчлэгдлээ";
          let message = `${task.ner} (${task.taskId}) даалгавар шинэчлэгдлээ`;

          if (targetStatus === "khiigdej bui") {
            turul = "taskStarted";
            title = "Даалгавар эхэллээ";
            message = `${task.ner} (${task.taskId}) даалгавар эхэлсэн`;
          } else if (targetStatus === "khugatsaa khetersen") {
            turul = "taskExpired";
            title = "Даалгавар хугацаа хэтэрсэн";
            message = `${task.ner} (${task.taskId}) даалгаврын хугацаа хэтэрлээ`;
          } else if (targetStatus === "duussan") {
            turul = "taskCompleted";
            title = "Даалгавар дууссан";
            message = `${task.ner} (${task.taskId}) даалгавар амжилттай дууссан`;
          }

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
              }, baseConn);
              emitToRoom(`user_${memberId}`, "new_notification", notification);
            } catch (notifError) {
              console.error(`[Task Status] Notification error for ${memberId}:`, notifError);
            }
          }
          console.log(`[Task Status] ✅ Task ${task.taskId} updated status: ${currentStatus} → ${targetStatus}`);
      }

      return {
        success: true,
        oldStatus: currentStatus,
        newStatus: targetStatus,
        task: task
      };
    } else {
      return {
        success: true,
        message: "Status/Timers already up to date",
        status: currentStatus
      };
    }
  } catch (error) {
    console.error("[Task Status] ❌ Error updating task status:", error);
    throw error;
  }
};
