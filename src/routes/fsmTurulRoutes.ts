import { Router } from "express";
import {
  getTuruls,
  createTurul,
  updateTurul,
  deleteTurul,
} from "../controllers/fsmTurulController";
import { validateFSMAccess } from "../middlewares/fsmAccess";

const router = Router();

router.get("/fsm-turuls", validateFSMAccess, getTuruls);
router.post("/fsm-turuls", validateFSMAccess, createTurul);
router.put("/fsm-turuls/:id", validateFSMAccess, updateTurul);
router.delete("/fsm-turuls/:id", validateFSMAccess, deleteTurul);

export default router;
