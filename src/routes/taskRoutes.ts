import { Router } from "express";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  uploadTaskImage,
  startTaskTime,
  endTaskTime,
} from "../controllers/taskController";
import { authMiddleware } from "../middlewares/auth";
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

// All task routes require Bearer token authentication (from tureesBack)
router.get("/tasks", authMiddleware, getTasks);
router.get("/tasks/:id", authMiddleware, getTask);
router.post("/tasks", authMiddleware, createTask);
router.put("/tasks/:id", authMiddleware, updateTask);
router.delete("/tasks/:id", authMiddleware, deleteTask);
router.post("/tasks/:id/upload-image", authMiddleware, upload.single("file"), uploadTaskImage);
router.post("/tasks/:id/start-time", authMiddleware, startTaskTime);
router.post("/tasks/:id/end-time", authMiddleware, endTaskTime);

export default router;
