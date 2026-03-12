import { Response } from "express";
import {
  registerFcmToken,
  getUserFcmTokens,
  deactivateFcmToken,
  removeFcmToken
} from "../services/fcmTokenService";
import { getFsmConnFromReq } from "../utils/fsmConn";

/**
 * Register or update FCM token
 * Works even if user is not logged in - just needs ajiltniiId
 * POST /fcm/register
 */
export const registerToken = async (req: any, res: Response, next: any) => {
  try {
    const { token, deviceType, deviceId, appVersion } = req.body;
    const ajiltniiId = req.body.ajiltniiId || req.ajiltan?.id;
    const baiguullagiinId = req.body.baiguullagiinId || req.ajiltan?.baiguullagiinId;

    if (!token) {
      return res.status(400).json({ success: false, message: "FCM token шаардлагатай" });
    }

    if (!ajiltniiId) {
      return res.status(400).json({ success: false, message: "Ажилтны ID шаардлагатай" });
    }

    const fcmToken = await registerFcmToken({
      ajiltniiId,
      token,
      deviceType: deviceType || "web",
      deviceId,
      appVersion,
      baiguullagiinId
    }, getFsmConnFromReq(req));

    console.log("[FCM Token] ✅ Token registered:", {
      ajiltniiId,
      token: token.substring(0, 20) + "...",
      deviceType: deviceType || "web"
    });

    res.json({
      success: true,
      message: "FCM token амжилттай бүртгэгдлээ",
      data: fcmToken
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user's FCM tokens
 * GET /fcm/tokens
 */
export const getTokens = async (req: any, res: Response, next: any) => {
  try {
    const ajiltniiId = req.query.ajiltniiId || req.ajiltan?.id;

    if (!ajiltniiId) {
      return res.status(400).json({ success: false, message: "Ажилтны ID шаардлагатай" });
    }

    const tokens = await getUserFcmTokens(ajiltniiId, getFsmConnFromReq(req));
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

/**
 * Deactivate FCM token (when user logs out)
 * PUT /fcm/deactivate
 */
export const deactivateToken = async (req: any, res: Response, next: any) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "FCM token шаардлагатай" });
    }

    await deactivateFcmToken(token, getFsmConnFromReq(req));
    res.json({ success: true, message: "FCM token идэвхгүй болголоо" });
  } catch (err) {
    next(err);
  }
};

/**
 * Remove FCM token completely
 * DELETE /fcm/token/:token
 */
export const removeToken = async (req: any, res: Response, next: any) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: "FCM token шаардлагатай" });
    }

    await removeFcmToken(token, getFsmConnFromReq(req));
    res.json({ success: true, message: "FCM token устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
