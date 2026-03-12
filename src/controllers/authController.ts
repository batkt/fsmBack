import { Response } from "express";
import { loginWithTurees, getAjiltanDetails } from "../services/authService";

export const login = async (req: any, res: Response, next: any) => {
  try {
    const { nevtrekhNer, nuutsUg } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;
    const tsag = new Date().toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" });

    console.log(`[LOGIN] ${tsag} | IP: ${ip} | Хэрэглэгч: ${nevtrekhNer}`);

    const result = await loginWithTurees(nevtrekhNer, nuutsUg);

    if (!result) {
      console.log(`[LOGIN] ❌ Амжилтгүй | ${nevtrekhNer} | IP: ${ip}`);
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log(`[LOGIN] ✅ Амжилттай | ${nevtrekhNer} | ID: ${result.result?._id} | IP: ${ip}`);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

export const getMe = async (req: any, res: Response, next: any) => {
  try {
    const details = await getAjiltanDetails(req.ajiltan.id, req.ajiltan.baiguullagiinId);
    res.json({ success: true, ...details });
  } catch (err) { next(err); }
};

/**
 * Request OTP for forgot password
 * Sends OTP to employee's phone number
 */
export const forgotPassword = async (req: any, res: Response, next: any) => {
  try {
    const { utas } = req.body;
    
    if (!utas) {
      return res.status(400).json({ 
        success: false, 
        message: "Утасны дугаар оруулах шаардлагатай" 
      });
    }
    
    const { requestOTP } = require("../services/otpService");
    const result = await requestOTP(utas, "forgot_password");
    
    // In development, return OTP for testing (remove in production)
    res.json({
      success: true,
      message: "OTP код таны утас руу илгээгдлээ",
      expiresAt: result.expiresAt,
      // Remove this in production - only for development/testing
      ...(process.env.NODE_ENV !== "production" && { otp: result.otp })
    });
  } catch (err: any) {
    if (err.message.includes("олдсонгүй")) {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Verify OTP code
 * Verifies the OTP and returns a reset token
 */
export const verifyOTP = async (req: any, res: Response, next: any) => {
  try {
    const { utas, otp } = req.body;
    
    if (!utas || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: "Утасны дугаар болон OTP код оруулах шаардлагатай" 
      });
    }
    
    const { verifyOTP: verifyOTPService } = require("../services/otpService");
    const result = await verifyOTPService(utas, otp, "forgot_password");
    
    res.json({
      success: true,
      message: "OTP код баталгаажлаа",
      resetToken: result.resetToken
    });
  } catch (err: any) {
    if (err.message.includes("олдсонгүй") || 
        err.message.includes("дууссан") || 
        err.message.includes("буруу") ||
        err.message.includes("хэт олон")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Reset password using reset token
 * Sets new password after OTP verification
 */
export const resetPassword = async (req: any, res: Response, next: any) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    if (!resetToken || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Reset токен болон шинэ нууц үг оруулах шаардлагатай" 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой" 
      });
    }
    
    const { resetPassword: resetPasswordService } = require("../services/otpService");
    await resetPasswordService(resetToken, newPassword);
    
    res.json({
      success: true,
      message: "Нууц үг амжилттай солигдлоо"
    });
  } catch (err: any) {
    if (err.message.includes("хүчингүй") || 
        err.message.includes("дууссан") || 
        err.message.includes("баталгаажаагүй") ||
        err.message.includes("олдсонгүй")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};