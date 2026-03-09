import { Router } from "express";
import {
  getUilchluulegchs,
  getUilchluulegch,
  createUilchluulegch,
  updateUilchluulegch,
  deleteUilchluulegch,
  refreshUilchluulegchStats,
  refreshAllUilchluulegchStats,
} from "../controllers/uilchluulegchController";


import { authMiddleware } from "../middlewares/auth";

const router = Router();

// All uilchluulegch routes require Bearer token authentication (from tureesBack)
router.get("/uilchluulegch", authMiddleware, getUilchluulegchs);
router.get("/uilchluulegch/:id", authMiddleware, getUilchluulegch);
router.post("/uilchluulegch", authMiddleware, createUilchluulegch);
router.post("/uilchluulegch/refresh-all-stats", authMiddleware, refreshAllUilchluulegchStats);
router.put("/uilchluulegch/:id", authMiddleware, updateUilchluulegch);

router.delete("/uilchluulegch/:id", authMiddleware, deleteUilchluulegch);
router.post("/uilchluulegch/:id/refresh-stats", authMiddleware, refreshUilchluulegchStats);


export default router;
