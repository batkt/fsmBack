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
// IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)
// Otherwise Express will match "read-all" as an :id parameter

// Specific routes (no parameters)
router.get("/medegdel", authMiddleware, getMedegdels);
router.get("/medegdel/unread-count", authMiddleware, getUnreadCount);
router.put("/medegdel/read-all", authMiddleware, markAllAsRead); // PUT /medegdel/read-all
router.post("/medegdel/read-all", authMiddleware, markAllAsRead); // POST /medegdel/read-all (alternative)

// Parameterized routes (must come after specific routes)
router.get("/medegdel/:id", authMiddleware, getMedegdel);
router.post("/medegdel", authMiddleware, createMedegdel);
router.put("/medegdel/:id", authMiddleware, updateMedegdel);
router.put("/medegdel/:id/read", authMiddleware, markAsRead);
router.delete("/medegdel/:id", authMiddleware, deleteMedegdel);

export default router;
