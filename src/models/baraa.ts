const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const baraaSchema = new Schema(
  {
    ner: { type: String, required: true },
    turul: {
      type: String,
      default: "tseverlegch"
    },
    negj: {
      type: String,
      enum: ["shirheg", "litr", "kg", "haire", "bogts", "dana"],
      default: "shirheg"
    },
    uldegdel: { type: Number, default: 0 },
    shirhegiinToo: { type: Number, default: 1 }, // хайрцаг доторх ширхэгийн тоо
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

baraaSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });
baraaSchema.index({ baiguullagiinId: 1, turul: 1 });
baraaSchema.index({ ner: "text" });
baraaSchema.index({ barcode: 1 });

module.exports = function a(conn: any, connectFSM = true, modelName = "baraa") {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  
  const fsmConn = connectFSM && conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;

  return fsmConn.models[modelName] || fsmConn.model(modelName, baraaSchema);
};
