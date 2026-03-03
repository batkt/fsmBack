import * as admin from "firebase-admin";
import { getUsersFcmTokens } from "./fcmTokenService";

// Initialize Firebase Admin (will be called from server.ts)
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Call this once when server starts
 */
export const initializeFirebase = () => {
  if (firebaseInitialized) {
    console.log("[FCM] Firebase already initialized");
    return;
  }

  try {
    // Check if Firebase service account file is provided
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    console.log("[FCM] Initializing Firebase...");
    console.log("[FCM] Service account path from env:", serviceAccountPath);

    if (!serviceAccountPath) {
      console.warn("[FCM] ⚠️ Firebase service account not configured. Push notifications will be disabled.");
      console.warn("[FCM] Set FIREBASE_SERVICE_ACCOUNT_PATH in .env file");
      console.warn("[FCM] Example: FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json");
      return;
    }

    // Resolve path (handle both relative and absolute paths)
    const path = require("path");
    const fs = require("fs");
    const resolvedPath = path.isAbsolute(serviceAccountPath) 
      ? serviceAccountPath 
      : path.resolve(process.cwd(), serviceAccountPath);

    console.log("[FCM] Resolved path:", resolvedPath);
    console.log("[FCM] File exists:", fs.existsSync(resolvedPath));

    if (!fs.existsSync(resolvedPath)) {
      console.error("[FCM] ❌ Service account file not found at:", resolvedPath);
      console.error("[FCM] Current working directory:", process.cwd());
      return;
    }

    // Initialize with service account file
    const serviceAccount = require(resolvedPath);
    console.log("[FCM] Service account loaded, project_id:", serviceAccount.project_id);

    // Check if Firebase app already exists
    try {
      admin.app();
      console.log("[FCM] Firebase app already exists, deleting...");
      admin.app().delete();
    } catch (e) {
      // App doesn't exist, which is fine
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseInitialized = true;
    console.log("[FCM] ✅ Firebase Admin SDK initialized successfully");
    console.log("[FCM] Project ID:", serviceAccount.project_id);
  } catch (error) {
    console.error("[FCM] ❌ Failed to initialize Firebase:", error);
    if (error instanceof Error) {
      console.error("[FCM] Error message:", error.message);
      console.error("[FCM] Error stack:", error.stack);
    }
    firebaseInitialized = false;
  }
};

/**
 * Send push notification to a single user
 */
export const sendPushNotification = async (
  ajiltniiId: string,
  notification: {
    title: string;
    body: string;
    data?: any;
  }
): Promise<{ success: boolean; sent: number; failed: number }> => {
  if (!firebaseInitialized) {
    console.warn("[FCM] ⚠️ Firebase not initialized, skipping push notification");
    console.warn("[FCM] Check server startup logs for Firebase initialization errors");
    // Try to initialize again (in case .env was updated)
    console.log("[FCM] Attempting to initialize Firebase again...");
    initializeFirebase();
    if (!firebaseInitialized) {
      return { success: false, sent: 0, failed: 0 };
    }
  }

  try {
    // Get all active FCM tokens for this user
    const tokens = await getUsersFcmTokens([ajiltniiId]);
    
    if (tokens.length === 0) {
      console.log(`[FCM] No FCM tokens found for user: ${ajiltniiId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    const tokenList = tokens.map((t: any) => t.token);
    console.log(`[FCM] Sending push notification to ${tokenList.length} device(s) for user: ${ajiltniiId}`);

    // Prepare FCM message
    const messageData: Record<string, string> = notification.data ? {
      ...Object.entries(notification.data).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    } : {};

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: messageData,
      tokens: tokenList,
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1
          }
        }
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default"
        }
      }
    };

    // Send to all devices
    // Use individual sends for compatibility with all Firebase Admin SDK versions
    let successCount = 0;
    let failureCount = 0;
    const failedTokens: string[] = [];

    for (const token of tokenList) {
      try {
        const individualMessage: admin.messaging.Message = {
          notification: message.notification!,
          ...(Object.keys(messageData).length > 0 && { data: messageData }),
          token: token,
          ...(message.apns && { apns: message.apns }),
          ...(message.android && { android: message.android })
        };
        await admin.messaging().send(individualMessage);
        successCount++;
      } catch (error: any) {
        failureCount++;
        failedTokens.push(token);
        console.error(`[FCM] Failed to send to token ${token.substring(0, 20)}...:`, error.message);
      }
    }

    const response = {
      successCount,
      failureCount,
      responses: tokenList.map((token: string) => ({
        success: !failedTokens.includes(token),
        error: failedTokens.includes(token) ? { message: "Send failed" } : undefined
      }))
    };

    // Handle failed tokens (remove invalid tokens)
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokenList[idx]);
          console.error(`[FCM] Failed to send to token ${tokenList[idx]}:`, resp.error?.message);
        }
      });

      // Remove invalid tokens
      if (failedTokens.length > 0) {
        const { deactivateFcmToken } = require("./fcmTokenService");
        for (const token of failedTokens) {
          await deactivateFcmToken(token);
        }
      }
    }

    console.log(`[FCM] ✅ Push notification sent: ${response.successCount} success, ${response.failureCount} failed`);
    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount
    };
  } catch (error) {
    console.error("[FCM] ❌ Error sending push notification:", error);
    return { success: false, sent: 0, failed: 0 };
  }
};

/**
 * Send push notification to multiple users
 */
export const sendPushNotificationToUsers = async (
  ajiltniiIds: string[],
  notification: {
    title: string;
    body: string;
    data?: any;
  }
): Promise<{ success: boolean; sent: number; failed: number }> => {
  if (!firebaseInitialized) {
    console.warn("[FCM] ⚠️ Firebase not initialized, skipping push notification");
    return { success: false, sent: 0, failed: 0 };
  }

  try {
    // Get all active FCM tokens for these users
    const tokens = await getUsersFcmTokens(ajiltniiIds);
    
    if (tokens.length === 0) {
      console.log(`[FCM] No FCM tokens found for users: ${ajiltniiIds.join(", ")}`);
      return { success: true, sent: 0, failed: 0 };
    }

    const tokenList = tokens.map((t: any) => t.token);
    console.log(`[FCM] Sending push notification to ${tokenList.length} device(s) for ${ajiltniiIds.length} user(s)`);

    // Prepare FCM message
    const messageData: Record<string, string> = notification.data ? {
      ...Object.entries(notification.data).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    } : {};

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: messageData,
      tokens: tokenList,
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1
          }
        }
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default"
        }
      }
    };

    // Send to all devices
    // Use individual sends for compatibility with all Firebase Admin SDK versions
    let successCount = 0;
    let failureCount = 0;
    const failedTokens: string[] = [];

    for (const token of tokenList) {
      try {
        const individualMessage: admin.messaging.Message = {
          notification: message.notification!,
          ...(Object.keys(messageData).length > 0 && { data: messageData }),
          token: token,
          ...(message.apns && { apns: message.apns }),
          ...(message.android && { android: message.android })
        };
        await admin.messaging().send(individualMessage);
        successCount++;
      } catch (error: any) {
        failureCount++;
        failedTokens.push(token);
        console.error(`[FCM] Failed to send to token ${token.substring(0, 20)}...:`, error.message);
      }
    }

    const response = {
      successCount,
      failureCount,
      responses: tokenList.map((token: string) => ({
        success: !failedTokens.includes(token),
        error: failedTokens.includes(token) ? { message: "Send failed" } : undefined
      }))
    };

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokenList[idx]);
          console.error(`[FCM] Failed to send to token ${tokenList[idx]}:`, resp.error?.message);
        }
      });

      // Remove invalid tokens
      if (failedTokens.length > 0) {
        const { deactivateFcmToken } = require("./fcmTokenService");
        for (const token of failedTokens) {
          await deactivateFcmToken(token);
        }
      }
    }

    console.log(`[FCM] ✅ Push notification sent: ${response.successCount} success, ${response.failureCount} failed`);
    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount
    };
  } catch (error) {
    console.error("[FCM] ❌ Error sending push notification:", error);
    return { success: false, sent: 0, failed: 0 };
  }
};
