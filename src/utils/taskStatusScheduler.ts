/**
 * Task Status Scheduler
 * 
 * This module handles automatic task status updates based on time.
 * It can be run as a cron job or scheduled task.
 */

import { updateTaskStatusesByTime } from "../services/taskStatusService";

let schedulerInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Start the task status scheduler
 * Checks and updates task statuses every specified interval
 * 
 * @param intervalMinutes - How often to check (default: 5 minutes)
 */
export const startTaskStatusScheduler = (intervalMinutes: number = 5) => {
  if (schedulerInterval) {
    console.log("[Task Scheduler] ⚠️ Scheduler already running");
    return;
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`[Task Scheduler] 🚀 Starting task status scheduler (checking every ${intervalMinutes} minutes)`);

  // Run immediately on start
  runTaskStatusUpdate();

  // Then run on interval
  schedulerInterval = setInterval(() => {
    runTaskStatusUpdate();
  }, intervalMs);
};

/**
 * Stop the task status scheduler
 */
export const stopTaskStatusScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Task Scheduler] ⏹️ Task status scheduler stopped");
  }
};

/**
 * Run the task status update (internal function)
 */
const runTaskStatusUpdate = async () => {
  if (isRunning) {
    console.log("[Task Scheduler] ⚠️ Update already in progress, skipping...");
    return;
  }

  isRunning = true;
  try {
    console.log("[Task Scheduler] 🔄 Running task status update...");
    const result = await updateTaskStatusesByTime();
    if (result.updated > 0) {
      console.log(`[Task Scheduler] ✅ Updated ${result.updated} task(s)`);
    } else {
      console.log("[Task Scheduler] ℹ️ No tasks needed status updates");
    }
  } catch (error) {
    console.error("[Task Scheduler] ❌ Error in scheduled update:", error);
  } finally {
    isRunning = false;
  }
};

/**
 * Get scheduler status
 */
export const getSchedulerStatus = () => {
  return {
    isRunning: schedulerInterval !== null,
    isUpdating: isRunning
  };
};
