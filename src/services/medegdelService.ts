import { getConn } from "../utils/db";

const getMedegdelModel = require("../models/medegdel");

export const medegdelJagsaalt = async (query: any, conn?: any) => {
  const baseConn = conn || getConn();
  return await getMedegdelModel(baseConn, true)
    .find(query)
    .sort({ createdAt: -1 })
    .lean();
};

export const medegdelUusgekh = async (data: any, conn?: any) => {
  const baseConn = conn || getConn();
  const notification = await getMedegdelModel(baseConn, true).create(data);

  // Send FCM push notification (async, don't wait for it)
  // This works even if user is not logged in - they just need to have registered FCM token
  if (notification.ajiltniiId) {
    try {
      const { sendPushNotification } = require("./fcmService");
      await sendPushNotification(notification.ajiltniiId, {
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification._id.toString(),
          turul: notification.turul || "medegdel", // Changed from 'type' to 'turul' to match frontend
          projectId: notification.projectId || "",
          taskId: notification.taskId || "",
          baiguullagiinId: notification.baiguullagiinId || "",
          barilgiinId: notification.barilgiinId || ""
        }
      });
    } catch (fcmError) {
      // Don't fail notification creation if FCM fails
      console.error("[Medegdel] Failed to send FCM push notification:", fcmError);
    }
  }

  return notification;
};

export const medegdelZasakh = async (id: string, data: any, conn?: any) => {
  const baseConn = conn || getConn();
  return await getMedegdelModel(baseConn, true)
    .findByIdAndUpdate(id, data, { new: true })
    .lean();
};

export const medegdelKharlaa = async (id: string, ajiltniiId: string, conn?: any) => {
  const baseConn = conn || getConn();
  // Mark as read
  await getMedegdelModel(baseConn, true).findByIdAndUpdate(id, {
    $set: { kharsanEsekh: true, tuluv: 1 }
  });
  
  // Remove from "not seen" list if exists
  await getMedegdelModel(baseConn, true).findByIdAndUpdate(id, {
    $pull: { dakhijKharakhguiAjiltniiIdnuud: ajiltniiId }
  });
  
  return await getMedegdelModel(baseConn, true).findById(id).lean();
};

export const medegdelNegAvakh = async (id: string, conn?: any) => {
  const baseConn = conn || getConn();
  return await getMedegdelModel(baseConn, true).findById(id).lean();
};

export const medegdelUstgakh = async (id: string, conn?: any) => {
  const baseConn = conn || getConn();
  return await getMedegdelModel(baseConn, true).findByIdAndDelete(id);
};

// Mark all notifications as read for a user
export const medegdelBuhKharlaa = async (ajiltniiId: string, baiguullagiinId?: string, conn?: any) => {
  const baseConn = conn || getConn();
  const query: any = { ajiltniiId, kharsanEsekh: false };
  if (baiguullagiinId) query.baiguullagiinId = baiguullagiinId;
  
  return await getMedegdelModel(baseConn, true).updateMany(query, {
    $set: { kharsanEsekh: true, tuluv: 1 },
    $pull: { dakhijKharakhguiAjiltniiIdnuud: ajiltniiId }
  });
};

// Get unread count for a user
export const medegdelUnreadCount = async (ajiltniiId: string, baiguullagiinId?: string, conn?: any) => {
  const baseConn = conn || getConn();
  const query: any = { ajiltniiId, kharsanEsekh: false };
  if (baiguullagiinId) query.baiguullagiinId = baiguullagiinId;
  
  return await getMedegdelModel(baseConn, true).countDocuments(query);
};
