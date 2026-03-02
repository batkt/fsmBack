import { Router } from "express";
import {
  getSubTasks,
  getSubTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
} from "../controllers/subTaskController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// All subtask routes require Bearer token authentication (from tureesBack)
router.get("/subtasks", authMiddleware, getSubTasks);
router.get("/subtasks/:id", authMiddleware, getSubTask);
router.post("/subtasks", authMiddleware, createSubTask);
router.put("/subtasks/:id", authMiddleware, updateSubTask);
router.delete("/subtasks/:id", authMiddleware, deleteSubTask);

export default router;
