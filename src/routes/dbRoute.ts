import { Router } from "express";
import { createBaiguullaga, getBaiguullaguud } from "../controllers/dbController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// Database configuration routes require Bearer token authentication (from tureesBack)
router.post("/baiguullagaBurtgekh", authMiddleware, createBaiguullaga);
router.get("/baiguullaguud", authMiddleware, getBaiguullaguud);

export default router;
