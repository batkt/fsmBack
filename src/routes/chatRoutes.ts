import { Router } from "express";
import { getChats, createChat, deleteChat, uploadFile, readChats } from "../controllers/chatController";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

import { authMiddleware } from "../middlewares/auth";

// All chat routes require Bearer token authentication (from tureesBack)
router.get("/chats", authMiddleware, getChats);
router.post("/chats", authMiddleware, createChat);
router.put("/chats/read", authMiddleware, readChats);
router.post("/chats/upload", authMiddleware, upload.single("file"), uploadFile);
router.delete("/chats/:id", authMiddleware, deleteChat);

export default router;
