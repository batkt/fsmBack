import { Router } from "express";
import {
  getBaraas,
  getBaraa,
  createBaraa,
  updateBaraa,
  deleteBaraa,
  getBaraaUsageStats,
} from "../controllers/baraaController";

import { authMiddleware } from "../middlewares/auth";
import { validateFSMAccess } from "../middlewares/fsmAccess";

const router = Router();

// All baraa routes require Bearer token authentication (from tureesBack)
router.get("/baraas", authMiddleware, getBaraas);
router.get("/baraas/usage-stats", authMiddleware, getBaraaUsageStats);
router.get("/baraas/:id", authMiddleware, getBaraa);

// Create/Update/Delete require FSM access validation
router.post("/baraas", authMiddleware, validateFSMAccess, createBaraa);
router.put("/baraas/:id", authMiddleware, validateFSMAccess, updateBaraa);
router.delete("/baraas/:id", authMiddleware, validateFSMAccess, deleteBaraa);

export default router;
