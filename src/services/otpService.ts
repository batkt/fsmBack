import { getConn } from "../utils/db";
const getOtpModel = require("../models/otp");
import { sendSMS, formatPhoneNumber } from "./smsService";

const getCol = (name: string) => getConn().kholbolt.collection(name);

/**
 * Generate a random 6-digit OTP code
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Request OTP for forgot password
 * 
 * @param utas Phone number
 * @param purpose Purpose of OTP (default: "forgot_password")
 * @returns OTP code (for development/testing - remove in production)
 */
export const requestOTP = async (utas: string, purpose: string = "forgot_password", baiguullagiinId?: string): Promise<{ otp: string; expiresAt: Date }> => {
  const conn = getConn();
  // OTP is stored in FSM database (kholboltFSM)
  const OtpModel = getOtpModel(conn, true);
  
  // Format phone number
  const formattedPhone = formatPhoneNumber(utas);
  
  // Try multiple phone number formats to find employee
  // Phone numbers in database might be stored in different formats
  const phoneVariations = [
    formattedPhone,           // +976xxxxxxxx
    utas,                     // Original input
    formattedPhone.replace(/^\+976/, "976"),  // 976xxxxxxxx
    formattedPhone.replace(/^\+976/, ""),     // xxxxxxxx (local)
    utas.replace(/^0/, ""),   // Remove leading 0
    utas.replace(/\D/g, ""),  // Digits only
    "0" + utas.replace(/^0/, "").replace(/\D/g, ""), // Add leading 0
  ];
  
  // Remove duplicates and empty strings
  const uniquePhones = [...new Set(phoneVariations.filter(p => p && p.length > 0))];
  
  // Try to find employee using $in operator (more efficient)
  let ajiltan = await getCol("ajiltan").findOne({ utas: { $in: uniquePhones } });
  
  // If still not found, try regex pattern matching (for partial matches)
  if (!ajiltan) {
    const digitsOnly = utas.replace(/\D/g, "");
    if (digitsOnly.length >= 8) {
      // Try to find by last 8 digits (Mongolian mobile numbers are 8 digits)
      const last8Digits = digitsOnly.slice(-8);
      ajiltan = await getCol("ajiltan").findOne({
        $or: [
          { utas: { $regex: last8Digits + "$", $options: "i" } }, // Ends with these digits
          { utas: { $regex: "^" + last8Digits, $options: "i" } } // Starts with these digits
        ]
      });
    }
  }
  
  if (!ajiltan) {
    throw new Error("Дугаар олдсонгүй");
  }
  
  const ajiltniiId = ajiltan._id.toString();
  // Get baiguullagiinId from employee if not provided
  const employeeBaiguullagiinId = baiguullagiinId || ajiltan.baiguullagiinId;
  
  // Delete any existing unverified OTPs for this phone
  await OtpModel.deleteMany({ 
    utas: { $in: [formattedPhone, utas] }, 
    purpose, 
    verified: false 
  });
  
  // Generate new OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Save OTP
  await OtpModel.create({
    utas: formattedPhone,
    ajiltniiId,
    otp,
    purpose,
    expiresAt,
    verified: false,
    attempts: 0
  });
  
  // Send SMS with transliterated Mongolian text
  const message = `Tany nuuts ug sergeekh code: ${otp}. 10 minutiin dotor kuchintei.`;
  await sendSMS({
    to: formattedPhone,
    message: message,
    baiguullagiinId: employeeBaiguullagiinId
  });
  
  return { otp, expiresAt };
};

/**
 * Verify OTP code
 * 
 * @param utas Phone number
 * @param otp OTP code to verify
 * @param purpose Purpose of OTP (default: "forgot_password")
 * @returns Verification token (for password reset)
 */
export const verifyOTP = async (utas: string, otp: string, purpose: string = "forgot_password"): Promise<{ verified: boolean; resetToken: string }> => {
  const conn = getConn();
  const OtpModel = getOtpModel(conn, true);
  
  // Format phone number
  const formattedPhone = formatPhoneNumber(utas);
  
  // Find the OTP record
  const otpRecord = await OtpModel.findOne({
    utas: { $in: [formattedPhone, utas] },
    purpose,
    verified: false
  }).sort({ createdAt: -1 }); // Get the most recent one
  
  if (!otpRecord) {
    throw new Error("OTP код олдсонгүй эсвэл аль хэдийн ашигласан байна");
  }
  
  // Check if expired
  if (new Date() > otpRecord.expiresAt) {
    await OtpModel.deleteOne({ _id: otpRecord._id });
    throw new Error("OTP кодын хугацаа дууссан байна");
  }
  
  // Check attempts
  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    await OtpModel.deleteOne({ _id: otpRecord._id });
    throw new Error("OTP кодыг хэт олон удаа буруу оруулсан байна. Шинэ код авах хэрэгтэй");
  }
  
  // Verify OTP
  if (otpRecord.otp !== otp) {
    // Increment attempts
    await OtpModel.updateOne(
      { _id: otpRecord._id },
      { $inc: { attempts: 1 } }
    );
    throw new Error("Буруу OTP код");
  }
  
  // Mark as verified
  await OtpModel.updateOne(
    { _id: otpRecord._id },
    { $set: { verified: true } }
  );
  
  // Generate reset token (JWT) - valid for 15 minutes
  const jwt = require("jsonwebtoken");
  const { config } = require("../config");
  
  const resetToken = jwt.sign(
    { 
      ajiltniiId: otpRecord.ajiltniiId,
      utas: formattedPhone,
      purpose: "password_reset",
      otpId: otpRecord._id.toString()
    },
    config.APP_SECRET,
    { expiresIn: "15m" }
  );
  
  return { verified: true, resetToken };
};

/**
 * Reset password using reset token
 * 
 * @param resetToken JWT token from verifyOTP
 * @param newPassword New password to set
 */
export const resetPassword = async (resetToken: string, newPassword: string): Promise<void> => {
  const jwt = require("jsonwebtoken");
  const bcrypt = require("bcrypt");
  const { config } = require("../config");
  
  // Verify token
  let decoded: any;
  try {
    decoded = jwt.verify(resetToken, config.APP_SECRET);
  } catch (error) {
    throw new Error("Reset токен хүчингүй эсвэл хугацаа дууссан байна");
  }
  
  if (decoded.purpose !== "password_reset") {
    throw new Error("Буруу токен төрөл");
  }
  
  const { ajiltniiId } = decoded;
  
  // Check if OTP was verified
  const conn = getConn();
  const OtpModel = getOtpModel(conn, true);
  const otpRecord = await OtpModel.findOne({
    ajiltniiId,
    verified: true,
    _id: decoded.otpId
  });
  
  if (!otpRecord) {
    throw new Error("OTP код баталгаажаагүй байна");
  }
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update password
  const result = await getCol("ajiltan").updateOne(
    { _id: require("mongoose").Types.ObjectId(ajiltniiId) },
    { $set: { nuutsUg: hashedPassword } }
  );
  
  if (result.matchedCount === 0) {
    throw new Error("Ажилтан олдсонгүй");
  }
  
  // Delete the OTP record (one-time use)
  await OtpModel.deleteOne({ _id: otpRecord._id });
  
};
