import { Router } from "express";
import {
  getMedegdels,
  createMedegdel,
  updateMedegdel,
  markAsRead,
  getMedegdel,
  deleteMedegdel,
  markAllAsRead,
  getUnreadCount,
} from "../controllers/medegdelController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// All notification routes require Bearer token authentication (from tureesBack)
router.get("/medegdel", authMiddleware, getMedegdels);
router.get("/medegdel/unread-count", authMiddleware, getUnreadCount);
router.get("/medegdel/:id", authMiddleware, getMedegdel);
router.post("/medegdel", authMiddleware, createMedegdel);
router.put("/medegdel/:id", authMiddleware, updateMedegdel);
router.put("/medegdel/:id/read", authMiddleware, markAsRead);
router.put("/medegdel/read-all", authMiddleware, markAllAsRead);
router.delete("/medegdel/:id", authMiddleware, deleteMedegdel);

export default router;
