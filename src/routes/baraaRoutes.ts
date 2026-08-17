import { Router } from "express";
import {
  getBaraas,
  getBaraa,
  createBaraa,
  updateBaraa,
  deleteBaraa,
  getBaraaUsageStats,
  getBaraaUsageTimeline,
  addBaraaIncome,
  getBaraaOrlogiinTuukh,
} from "../controllers/baraaController";

import { authMiddleware } from "../middlewares/auth";
import { validateFSMAccess } from "../middlewares/fsmAccess";

const router = Router();

router.get("/baraas", authMiddleware, getBaraas);
router.get("/baraas/usage-stats", authMiddleware, getBaraaUsageStats);
router.get("/baraas/usage-timeline", authMiddleware, getBaraaUsageTimeline);
router.get("/baraas/orlogiin-tuukh", authMiddleware, getBaraaOrlogiinTuukh);
router.get("/baraas/:id", authMiddleware, getBaraa);

router.post("/baraas", authMiddleware, validateFSMAccess, createBaraa);
router.post("/baraas/income", authMiddleware, validateFSMAccess, addBaraaIncome);
router.put("/baraas/:id", authMiddleware, validateFSMAccess, updateBaraa);
router.delete("/baraas/:id", authMiddleware, validateFSMAccess, deleteBaraa);

export default router;