const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

// Ажил менежментийн байгууллага/барилга тус бүрийн тохиргоо (нэг бичлэг).
const fsmTokhirgooSchema = new Schema(
  {
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true },
    // Идэвхтэй бол админ Төлөвлөгөөнд өнгөрсөн өдөрт ажил (хуваарь) нэмж болно.
    umnukhUdurtKhuvaariOruulakh: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

fsmTokhirgooSchema.index({ baiguullagiinId: 1, barilgiinId: 1 }, { unique: true });

module.exports = function a(conn: any, connectFSM = true, modelName = "fsmTokhirgoo") {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");

  const fsmConn = connectFSM && conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;

  return fsmConn.models[modelName] || fsmConn.model(modelName, fsmTokhirgooSchema);
};
