import { Router } from "express";
import { getChats, createChat, deleteChat, uploadFile } from "../controllers/chatController";
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

router.get("/chats", getChats);
router.post("/chats", createChat);
router.post("/chats/upload", upload.single("file"), uploadFile);
router.delete("/chats/:id", deleteChat);

export default router;
