import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  giveTaskPoints,
  giveClientTaskPoints,
  getTaskPoints,
  getUserKpi,
  refreshUserKpi,
  getBaiguullagaKpis
} from "../controllers/kpiController";

const router = Router();

// Task points (admin gives score 0-10 after task is done)
router.post("/tasks/:id/onoo", authMiddleware, giveTaskPoints);

// Task points (client gives score 0-10 after task is done)
router.post("/tasks/:id/client-onoo", authMiddleware, giveClientTaskPoints);

router.get("/tasks/:id/onoo", authMiddleware, getTaskPoints);

// User KPI endpoints
router.get("/users/:id/kpi", authMiddleware, getUserKpi);
router.post("/users/:id/kpi/refresh", authMiddleware, refreshUserKpi);
router.get("/baiguullaga/:id/kpi", authMiddleware, getBaiguullagaKpis);

export default router;
