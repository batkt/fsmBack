const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const fsmTurulSchema = new Schema(
  {
    ner: { type: String, required: true },
    // Юунд зориулсан ангилал вэ. Одоогоор зөвхөн барааны ангилал ("baraa").
    // Талбаргүй хуучин бичлэгүүдийг ч бараанд хамааруулж уншина
    // (utils/baraaAngilal.ts → BARAA_ZORIULALT_QUERY).
    zoriulalt: { type: String, default: "baraa" },
    // График, чип дээр харуулах өнгө (#RRGGBB). Хоосон бол үндсэн палитр.
    ungu: { type: String, default: "" },
    // Жагсаалтын эрэмбэ — бага нь эхэндээ.
    erembe: { type: Number, default: 0 },
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

fsmTurulSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });
fsmTurulSchema.index({ baiguullagiinId: 1, barilgiinId: 1, zoriulalt: 1, erembe: 1 });

module.exports = function a(conn: any, connectFSM = true, modelName = "fsmTurul") {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  
  const fsmConn = connectFSM && conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;

  return fsmConn.models[modelName] || fsmConn.model(modelName, fsmTurulSchema);
};
