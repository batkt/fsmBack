import { getConn } from "../utils/db";

const getFcmTokenModel = require("../models/fcmToken");

/**
 * Register or update FCM token for a user
 * Works even if user is not logged in (just needs ajiltniiId)
 */
export const registerFcmToken = async (data: {
  ajiltniiId: string;
  token: string;
  deviceType?: "ios" | "android" | "web";
  deviceId?: string;
  appVersion?: string;
  baiguullagiinId?: string;
}, conn?: any) => {
  const baseConn = conn || getConn();
  const FcmToken = getFcmTokenModel(baseConn, false); // Use main DB (turees)

  // Check if token already exists
  const existing = await FcmToken.findOne({ token: data.token });

  if (existing) {
    // Update existing token
    existing.ajiltniiId = data.ajiltniiId;
    existing.deviceType = data.deviceType || existing.deviceType;
    existing.deviceId = data.deviceId || existing.deviceId;
    existing.appVersion = data.appVersion || existing.appVersion;
    existing.baiguullagiinId = data.baiguullagiinId || existing.baiguullagiinId;
    existing.isActive = true;
    existing.lastUsed = new Date();
    return await existing.save();
  } else {
    // Create new token
    return await FcmToken.create({
      ...data,
      isActive: true,
      lastUsed: new Date()
    });
  }
};

/**
 * Get all active FCM tokens for a user
 */
export const getUserFcmTokens = async (ajiltniiId: string, conn?: any) => {
  const baseConn = conn || getConn();
  const FcmToken = getFcmTokenModel(baseConn, false);
  return await FcmToken.find({
    ajiltniiId: ajiltniiId,
    isActive: true
  }).lean();
};

/**
 * Get FCM tokens for multiple users
 */
export const getUsersFcmTokens = async (ajiltniiIds: string[], conn?: any) => {
  const baseConn = conn || getConn();
  const FcmToken = getFcmTokenModel(baseConn, false);
  return await FcmToken.find({
    ajiltniiId: { $in: ajiltniiIds },
    isActive: true
  }).lean();
};

/**
 * Deactivate FCM token (when user logs out or uninstalls app)
 */
export const deactivateFcmToken = async (token: string, conn?: any) => {
  const baseConn = conn || getConn();
  const FcmToken = getFcmTokenModel(baseConn, false);
  return await FcmToken.findOneAndUpdate(
    { token: token },
    { isActive: false },
    { new: true }
  );
};

/**
 * Remove FCM token completely
 */
export const removeFcmToken = async (token: string, conn?: any) => {
  const baseConn = conn || getConn();
  const FcmToken = getFcmTokenModel(baseConn, false);
  return await FcmToken.findOneAndDelete({ token: token });
};
