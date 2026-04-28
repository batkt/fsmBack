import express from "express";
import * as chatbotController from "../controllers/chatbotController";
const { authMiddleware } = require("../middlewares/auth");

const router = express.Router();

router.get("/defaults", authMiddleware, chatbotController.getDefaultQuestions);
router.post("/ask", authMiddleware, chatbotController.askBot);

export default router;
