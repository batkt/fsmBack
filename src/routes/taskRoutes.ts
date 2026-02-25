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

router.get("/tasks", authMiddleware, getTasks);
router.get("/tasks/:id", authMiddleware, getTask);
router.post("/tasks", authMiddleware, createTask);
router.put("/tasks/:id", authMiddleware, updateTask);
router.delete("/tasks/:id", authMiddleware, deleteTask);

export default router;
