import { Router } from "express";
import {
  getSubTasks,
  getSubTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
} from "../controllers/subTaskController";

const router = Router();

router.get("/subtasks", getSubTasks);
router.get("/subtasks/:id", getSubTask);
router.post("/subtasks", createSubTask);
router.put("/subtasks/:id", updateSubTask);
router.delete("/subtasks/:id", deleteSubTask);

export default router;
