const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const subTaskSchema = new Schema(
  {
    taskId: { type: String, required: true },
    projectId: { type: String, required: true },
    ner: { type: String, required: true },
    duussan: { type: Boolean, default: false },
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

subTaskSchema.index({ taskId: 1 });
subTaskSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });

module.exports = function (conn: any) {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = conn.kholbolt;
  return conn.model("subTask", subTaskSchema);
};
