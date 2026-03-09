import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  giveTaskPoints,
  getTaskPoints,
  getUserKpi,
  refreshUserKpi
} from "../controllers/kpiController";

const router = Router();

// Task points (admin gives score 0-10 after task is done)
router.post("/tasks/:id/onoo", authMiddleware, giveTaskPoints);
router.get("/tasks/:id/onoo", authMiddleware, getTaskPoints);

// User KPI endpoints
router.get("/users/:id/kpi", authMiddleware, getUserKpi);
router.post("/users/:id/kpi/refresh", authMiddleware, refreshUserKpi);

export default router;
