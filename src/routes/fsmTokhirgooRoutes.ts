import { Router } from "express";
import { getTokhirgoo, updateTokhirgoo } from "../controllers/fsmTokhirgooController";
import { validateFSMAccess } from "../middlewares/fsmAccess";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/fsm-tokhirgoo", authMiddleware, validateFSMAccess, getTokhirgoo);
router.put("/fsm-tokhirgoo", authMiddleware, validateFSMAccess, updateTokhirgoo);

export default router;
