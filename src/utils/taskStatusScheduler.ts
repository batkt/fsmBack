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
    const { getFsmConns } = require("./db");
    const { ensureFsmConn } = require("./fsmConn");
    const conns = getFsmConns();
    
    if (conns.length === 0) {
      console.log("[Task Scheduler] ℹ️ No FSM connections found to update");
    } else {
      console.log(`[Task Scheduler] 🔄 Running task status update for ${conns.length} tenants...`);
      let totalUpdated = 0;
      
      for (const conn of conns) {
        try {
          const baseConn = ensureFsmConn(conn);
          // Check if connection is actually ready
          const mConn = baseConn.kholbolt;
          if (mConn && mConn.readyState !== 1) {
             console.log(`[Task Scheduler] ⏳ Connection for ${conn.baiguullagiinId || 'unknown'} not ready (state: ${mConn.readyState}), skipping...`);
             continue;
          }

          const result = await updateTaskStatusesByTime(baseConn);
          totalUpdated += result.updated;
        } catch (connError: any) {
          console.error(`[Task Scheduler] ❌ Error updating tasks for connection:`, connError.message || connError);
        }
      }
      
      if (totalUpdated > 0) {
        console.log(`[Task Scheduler] ✅ Completed. Total updated: ${totalUpdated} task(s)`);
      } else {
        console.log("[Task Scheduler] ℹ️ No tasks needed status updates across all tenants");
      }
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
