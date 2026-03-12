const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const otpSchema = new Schema(
  {
    utas: { type: String, required: true, index: true }, // Phone number
    ajiltniiId: { type: String, required: true }, // Employee ID
    otp: { type: String, required: true }, // 4-digit OTP code
    purpose: { 
      type: String, 
      enum: ["forgot_password", "verify_phone"], 
      default: "forgot_password" 
    },
    verified: { type: Boolean, default: false }, // Whether OTP has been verified
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // Auto-delete after expiration
    attempts: { type: Number, default: 0 }, // Number of verification attempts
    maxAttempts: { type: Number, default: 5 } // Maximum allowed attempts
  },
  {
    timestamps: true
  }
);

// Index for quick lookup by phone and purpose
otpSchema.index({ utas: 1, purpose: 1, verified: 1 });
otpSchema.index({ ajiltniiId: 1 });

// Auto-delete expired documents
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Get OTP model from connection
 * OTP is stored in the FSM database (kholboltFSM)
 * @param conn Connection object (from getConn())
 * @param connectFSM Whether to use FSM database (default: true for OTP)
 * @param modelName Model name (default: "otp")
 */
module.exports = function a(conn: any, connectFSM = true, modelName = "otp") {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  
  // OTP stored in FSM database (fManageFsm)
  if (connectFSM && conn.kholboltFSM) {
    console.log(`[OTP Model] Using FSM database (kholboltFSM) for OTP storage`);
    conn = conn.kholboltFSM;
  } else {
    if (connectFSM) {
      console.warn(`[OTP Model] ⚠️ FSM database (kholboltFSM) not available, falling back to main database (kholbolt)`);
    }
    conn = conn.kholbolt;
  }
  
  return conn.model(modelName, otpSchema);
};
