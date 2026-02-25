import { Router } from "express";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/tasks", getTasks);
router.get("/tasks/:id", getTask);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

export default router;
