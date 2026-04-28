const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const botKnowledgeSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    keywords: [{ type: String }],
    isDefault: { type: Boolean, default: false }, // If true, shown as initial options
    usageCount: { type: Number, default: 0 },
    createdBy: { type: String }, // Admin who added it
    baiguullagiinId: { type: String }, // Organization ID if specific
  },
  {
    timestamps: true
  }
);

botKnowledgeSchema.index({ question: "text", keywords: "text" });

module.exports = function a(conn: any, modelName = "bot_knowledge") {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  
  return conn.kholbolt.model(modelName, botKnowledgeSchema);
};
