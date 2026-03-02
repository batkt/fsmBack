import { Router } from "express";
import { getTaskTuukhs, getTaskTuukh } from "../controllers/taskTuukhController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// All task-tuukh routes require Bearer token authentication (from tureesBack)
router.get("/task-tuukh", authMiddleware, getTaskTuukhs);
router.get("/task-tuukh/:id", authMiddleware, getTaskTuukh);

export default router;
