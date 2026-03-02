import { Router } from "express";
import {
  getBaraas,
  getBaraa,
  createBaraa,
  updateBaraa,
  deleteBaraa,
} from "../controllers/baraaController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// All baraa routes require Bearer token authentication (from tureesBack)
router.get("/baraas", authMiddleware, getBaraas);
router.get("/baraas/:id", authMiddleware, getBaraa);
router.post("/baraas", authMiddleware, createBaraa);
router.put("/baraas/:id", authMiddleware, updateBaraa);
router.delete("/baraas/:id", authMiddleware, deleteBaraa);

export default router;
