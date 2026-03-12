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
import { validateFSMAccess } from "../middlewares/fsmAccess";

const router = Router();

// All uilchluulegch routes require Bearer token authentication (from tureesBack)
router.get("/uilchluulegch", authMiddleware, getUilchluulegchs);
router.get("/uilchluulegch/:id", authMiddleware, getUilchluulegch);
// Create/Update/Delete require FSM access validation
router.post("/uilchluulegch", authMiddleware, validateFSMAccess, createUilchluulegch);
router.post("/uilchluulegch/refresh-all-stats", authMiddleware, validateFSMAccess, refreshAllUilchluulegchStats);
router.put("/uilchluulegch/:id", authMiddleware, validateFSMAccess, updateUilchluulegch);
router.delete("/uilchluulegch/:id", authMiddleware, validateFSMAccess, deleteUilchluulegch);
router.post("/uilchluulegch/:id/refresh-stats", authMiddleware, validateFSMAccess, refreshUilchluulegchStats);


export default router;
