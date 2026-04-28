const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const botInteractionSchema = new Schema(
  {
    userId: { type: String, required: true },
    userQuestion: { type: String, required: true },
    botAnswer: { type: String },
    isAnswered: { type: Boolean, default: false }, // False if bot couldn't find an answer
    feedback: { type: Number }, // 1 for good, -1 for bad
    baiguullagiinId: { type: String },
  },
  {
    timestamps: true
  }
);

module.exports = function a(conn: any, modelName = "bot_interaction") {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  
  return conn.kholbolt.model(modelName, botInteractionSchema);
};
