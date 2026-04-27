import { Router } from "express";
import {
  getTuruls,
  createTurul,
  updateTurul,
  deleteTurul,
} from "../controllers/fsmTurulController";
import { validateFSMAccess } from "../middlewares/fsmAccess";

const router = Router();

router.get("/api/fsm-turuls", validateFSMAccess, getTuruls);
router.post("/api/fsm-turuls", validateFSMAccess, createTurul);
router.put("/api/fsm-turuls/:id", validateFSMAccess, updateTurul);
router.delete("/api/fsm-turuls/:id", validateFSMAccess, deleteTurul);

export default router;
