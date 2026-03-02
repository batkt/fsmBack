const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const medegdelSchema = new Schema(
  {
    ajiltniiId: { type: String }, // Employee who receives the notification
    khariltsagchiinId: { type: String }, // Customer ID (if applicable)
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true },
    khuleenAvagchiinId: { type: String }, // Recipient ID
    projectId: { type: String }, // FSM: Link to project
    taskId: { type: String }, // FSM: Link to task
    turul: {
      type: String,
      enum: [
        "medegdel",
        "taskCreated",
        "taskUpdated",
        "taskCompleted",
        "projectCreated",
        "projectUpdated",
        "chatMessage",
        "assignment",
        "reminder"
      ],
      default: "medegdel"
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    kharsanEsekh: { type: Boolean, default: false }, // Read status
    zurag: { type: String }, // Image URL
    object: { type: Schema.Types.Mixed }, // Related object data
    adminMedegdelId: { type: String }, // For admin notifications
    tuluv: { type: Number, default: 0 }, // Status: 0 = unread, 1 = read
    dakhijKharakhguiAjiltniiIdnuud: [{ type: String }], // Employees who haven't seen
    dakhijKharikhEsekh: { type: Boolean, default: false } // All seen
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
medegdelSchema.index({ ajiltniiId: 1, kharsanEsekh: 1, createdAt: -1 });
medegdelSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });
medegdelSchema.index({ projectId: 1, taskId: 1 });
medegdelSchema.index({ turul: 1, createdAt: -1 });

module.exports = function a(conn: any, connectFSM = true, modelName = "medegdel") {
  if (!conn || !conn.kholbolt || !conn.kholboltFSM)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = connectFSM && !!conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;
  return conn.model(modelName, medegdelSchema);
};
