const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

// Same collection/schema shape as tureesBack's models/zassanBarimt.js.
// FSM's per-org connection (kholboltFSM) points at the same physical
// database as tureesBack's kholbolt for that org, so records written
// here show up in tureesBack's "Зассан түүх" (zassanBarimt) page.
const zassanBarimtSchema = new Schema(
  {
    baiguullagiinId: String,
    barilgiinId: String,
    classType: String,
    className: String,
    classId: String,
    classDugaar: String,
    classOgnoo: Date,
    ajiltniiId: String,
    ajiltniiNer: String,
    shaltgaan: String,
    uurchlult: [
      {
        talbar: String,
        talbarNer: String,
        umnukhUtga: String,
        shineUtga: String,
        utganiiTurul: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = function a(conn: any) {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  const fsmConn = conn.kholboltFSM || conn.kholbolt;
  return fsmConn.models["zassanBarimt"] || fsmConn.model("zassanBarimt", zassanBarimtSchema);
};
