import { Router } from "express";
import {
  getTuruls,
  createTurul,
  updateTurul,
  deleteTurul,
} from "../controllers/fsmTurulController";
import { validateFSMAccess } from "../middlewares/fsmAccess";

import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/fsm-turuls", authMiddleware, validateFSMAccess, getTuruls);
router.post("/fsm-turuls", authMiddleware, validateFSMAccess, createTurul);
router.put("/fsm-turuls/:id", authMiddleware, validateFSMAccess, updateTurul);
router.delete("/fsm-turuls/:id", authMiddleware, validateFSMAccess, deleteTurul);

export default router;
