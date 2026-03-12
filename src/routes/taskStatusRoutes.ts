import { Router } from "express";
import { Response } from "express";
import {
  updateTaskStatusesByTime,
  updateSingleTaskStatus,
  getTaskStatusByTime
} from "../services/taskStatusService";
import { getSchedulerStatus } from "../utils/taskStatusScheduler";
import { authMiddleware } from "../middlewares/auth";
import { getFsmConnFromReq } from "../utils/fsmConn";

const router = Router();

/**
 * Manually trigger task status update for all tasks
 * POST /task-status/update-all
 */
router.post("/task-status/update-all", authMiddleware, async (req: any, res: Response) => {
  try {
    const result = await updateTaskStatusesByTime(getFsmConnFromReq(req));
    res.json({
      success: true,
      message: `Updated ${result.updated} task(s)`,
      details: result.details
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update task statuses",
      error: error.message
    });
  }
});

/**
 * Update status for a single task
 * POST /task-status/update/:taskId
 *
 * Frontend can send optional `tuluv` in body to force status:
 *  - If `tuluv` is provided → use it directly (manual control)
 *  - If not provided → backend calculates based on time
 */
router.post("/task-status/update/:taskId", authMiddleware, async (req: any, res: Response) => {
  try {
    const { tuluv, ajiltanTsag } = req.body || {};
    const result = await updateSingleTaskStatus(req.params.taskId, tuluv, ajiltanTsag, getFsmConnFromReq(req));
    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || "Task not found"
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: error.message
    });
  }
});

/**
 * Get calculated status for a task (without updating)
 * GET /task-status/calculate/:taskId
 */
router.get("/task-status/calculate/:taskId", authMiddleware, async (req: any, res: Response) => {
  try {
    const getTaskModel = require("../models/task");
    const conn = getFsmConnFromReq(req);
    const Task = getTaskModel(conn, true);

    const task = await Task.findById(req.params.taskId).lean();
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const calculatedStatus = getTaskStatusByTime(task);
    res.json({
      success: true,
      data: {
        currentStatus: task.tuluv,
        calculatedStatus: calculatedStatus,
        shouldUpdate: task.tuluv !== calculatedStatus,
        task: {
          _id: task._id,
          taskId: task.taskId,
          ner: task.ner,
          ekhlekhTsag: task.ekhlekhTsag,
          duusakhTsag: task.duusakhTsag,
          khugatsaaDuusakhOgnoo: task.khugatsaaDuusakhOgnoo
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate task status",
      error: error.message
    });
  }
});

/**
 * Get scheduler status
 * GET /task-status/scheduler
 */
router.get("/task-status/scheduler", authMiddleware, async (req: any, res: Response) => {
  try {
    const status = getSchedulerStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to get scheduler status",
      error: error.message
    });
  }
});

export default router;
