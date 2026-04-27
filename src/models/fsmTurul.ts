const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const fsmTurulSchema = new Schema(
  {
    ner: { type: String, required: true },
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

fsmTurulSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });

module.exports = function a(conn: any, connectFSM = true, modelName = "fsmTurul") {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  
  const fsmConn = connectFSM && conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;

  return fsmConn.model(modelName, fsmTurulSchema);
};
