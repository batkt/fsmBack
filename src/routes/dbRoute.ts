import { Router } from "express";
import { createBaiguullaga, getBaiguullaguud } from "../controllers/dbController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/baiguullagaBurtgekh", createBaiguullaga);
router.get("/baiguullaguud", getBaiguullaguud);

export default router;
