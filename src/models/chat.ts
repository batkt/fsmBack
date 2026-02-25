import mongoose, { Schema } from "mongoose";

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

export default function getChatModel(conn: any) {
  if (!conn || !conn.kholbolt) {
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  }
  return conn.kholbolt.model("chat", chatSchema);
}
