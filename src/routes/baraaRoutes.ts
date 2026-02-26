import { Router } from "express";
import {
  getBaraas,
  getBaraa,
  createBaraa,
  updateBaraa,
  deleteBaraa,
} from "../controllers/baraaController";
const router = Router();

router.get("/baraas", getBaraas);
router.get("/baraas/:id", getBaraa);
router.post("/baraas", createBaraa);
router.put("/baraas/:id", updateBaraa);
router.delete("/baraas/:id", deleteBaraa);

export default router;
