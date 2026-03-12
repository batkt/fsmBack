const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const fcmTokenSchema = new Schema(
  {
    ajiltniiId: { type: String, required: true }, // Employee ID
    token: { type: String, required: true, unique: true }, // FCM device token
    deviceType: { type: String, enum: ["ios", "android", "web"], default: "web" }, // Device type
    deviceId: { type: String }, // Optional: Device identifier
    appVersion: { type: String }, // Optional: App version
    isActive: { type: Boolean, default: true }, // Token is active
    lastUsed: { type: Date, default: Date.now }, // Last time token was used
    baiguullagiinId: { type: String } // Optional: Company ID for filtering
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
fcmTokenSchema.index({ ajiltniiId: 1, isActive: 1 });
fcmTokenSchema.index({ token: 1 });
fcmTokenSchema.index({ baiguullagiinId: 1 });

module.exports = function a(conn: any, connectFSM = false, modelName = "fcmToken") {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  
  // FCM tokens stored in main database (turees) by default.
  // If connectFSM is true AND kholboltFSM exists, use FSM DB instead.
  const targetConn = connectFSM && conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;

  return targetConn.model(modelName, fcmTokenSchema);
};
