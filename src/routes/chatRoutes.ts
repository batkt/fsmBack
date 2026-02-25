import { Router } from "express";
import { getChats, createChat, deleteChat } from "../controllers/chatController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/chats", authMiddleware, getChats);
router.post("/chats", authMiddleware, createChat);
router.delete("/chats/:id", authMiddleware, deleteChat);

export default router;
