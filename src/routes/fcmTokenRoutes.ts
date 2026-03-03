import { Router } from "express";
import {
  registerToken,
  getTokens,
  deactivateToken,
  removeToken
} from "../controllers/fcmTokenController";

const router = Router();

// Register/update FCM token (works without auth - just needs ajiltniiId)
router.post("/fcm/register", registerToken);

// Get user's FCM tokens (optional auth - can use query param)
router.get("/fcm/tokens", getTokens);

// Deactivate FCM token
router.put("/fcm/deactivate", deactivateToken);

// Remove FCM token
router.delete("/fcm/token/:token", removeToken);

export default router;
