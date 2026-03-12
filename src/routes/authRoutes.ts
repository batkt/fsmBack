import { Router } from "express";
import { login, getMe, forgotPassword, verifyOTP, resetPassword } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/login", login);
router.get("/me", authMiddleware, getMe);

// Forgot password flow
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;
