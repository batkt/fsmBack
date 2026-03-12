import { Router } from "express";
import { getChats, createChat, deleteChat, editChat, uploadFile, readChats } from "../controllers/chatController";
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
import { validateFSMAccess } from "../middlewares/fsmAccess";

// All chat routes require Bearer token authentication (from tureesBack)
router.get("/chats", authMiddleware, getChats);
// Create/Update/Delete require FSM access validation
router.post("/chats", authMiddleware, validateFSMAccess, createChat);
router.put("/chats/read", authMiddleware, validateFSMAccess, readChats);
router.post("/chats/upload", authMiddleware, validateFSMAccess, upload.single("file"), uploadFile);
// Edit own message (update text)
router.patch("/chats/:id", authMiddleware, validateFSMAccess, editChat);
router.put("/chats/:id", authMiddleware, validateFSMAccess, editChat);
// Soft-delete own message
router.delete("/chats/:id", authMiddleware, validateFSMAccess, deleteChat);

export default router;
