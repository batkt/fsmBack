const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const chatSchema = new Schema(
  {
    projectId: { type: String, required: true },
    taskId: { type: String },
    ajiltniiId: { type: String, required: true },
    ajiltniiNer: { type: String },
    medeelel: { type: String },
    turul: {
      type: String,
      enum: ["text", "zurag", "file"],
      default: "text"
    },
    fileZam: { type: String },
    fileNer: { type: String },
    khemjee: { type: Number },
    fType: { type: String }, // MIME type
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

module.exports = function a(conn: any, connectFSM = true, modelName = "chat") {
  if (!conn || !conn.kholbolt || !conn.kholboltFSM)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = connectFSM && !!conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;
  return conn.model(modelName, chatSchema);
};
