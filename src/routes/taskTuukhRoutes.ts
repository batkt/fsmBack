import { Router } from "express";
import { getTaskTuukhs, getTaskTuukh } from "../controllers/taskTuukhController";
const router = Router();

router.get("/task-tuukh", getTaskTuukhs);
router.get("/task-tuukh/:id", getTaskTuukh);

export default router;
