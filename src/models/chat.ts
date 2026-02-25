const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const chatSchema = new Schema(
  {
    projectId: { type: String, required: true },
    taskId: { type: String },
    ajiltniiId: { type: String, required: true },
    ajiltniiNer: { type: String },
    medeelel: { type: String, required: true },
    turul: {
      type: String,
      enum: ["text", "zurag", "file"],
      default: "text"
    },
    fileZam: { type: String },
    unshsan: [{ type: String }],
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

chatSchema.index({ projectId: 1, taskId: 1, createdAt: -1 });
chatSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });
chatSchema.index({ ajiltniiId: 1 });

module.exports = function (conn: any) {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = conn.kholbolt;
  return conn.model("chat", chatSchema);
};
