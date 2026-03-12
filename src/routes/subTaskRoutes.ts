import { Router } from "express";
import {
  getSubTasks,
  getSubTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
} from "../controllers/subTaskController";
import { authMiddleware } from "../middlewares/auth";
import { validateFSMAccess } from "../middlewares/fsmAccess";

const router = Router();

// All subtask routes require Bearer token authentication (from tureesBack)
router.get("/subtasks", authMiddleware, getSubTasks);
router.get("/subtasks/:id", authMiddleware, getSubTask);
// Create/Update/Delete require FSM access validation
router.post("/subtasks", authMiddleware, validateFSMAccess, createSubTask);
router.put("/subtasks/:id", authMiddleware, validateFSMAccess, updateSubTask);
router.delete("/subtasks/:id", authMiddleware, validateFSMAccess, deleteSubTask);

export default router;
