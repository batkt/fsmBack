import express from "express";
import * as chatbotController from "../controllers/chatbotController";
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/defaults", verifyToken, chatbotController.getDefaultQuestions);
router.post("/ask", verifyToken, chatbotController.askBot);

export default router;
