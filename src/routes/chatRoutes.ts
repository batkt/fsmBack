import { Router } from "express";
import { getChats, createChat, deleteChat } from "../controllers/chatController";

const router = Router();

router.get("/chats", getChats);
router.post("/chats", createChat);
router.delete("/chats/:id", deleteChat);

export default router;
