const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

// Same collection/schema shape as tureesBack's models/zassanBarimt.js.
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

// ЗААВАЛ `kholbolt` — FSM-ийн өөрийн баазад (`kholboltFSM`) бичиж болохгүй.
// zassanBarimt бол tureesBack-ийн эзэмшдэг цуглуулга бөгөөд "Зассан түүх"
// хуудас нь зөвхөн `kholbolt` буюу байгууллагын үндсэн баазаас уншдаг.
// Өмнө нь `conn.kholboltFSM || conn.kholbolt` байсан тул FSM-ээс бичсэн
// бүх зассан түүх FSM баазад унаад, хуудсанд хэзээ ч харагддаггүй байв.
// `ajiltan`, `fcmToken` загварууд ч яг үүнтэй адил `kholbolt` ашигладаг.
module.exports = function a(conn: any) {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  const undsenConn = conn.kholbolt;
  return (
    undsenConn.models["zassanBarimt"] ||
    undsenConn.model("zassanBarimt", zassanBarimtSchema)
  );
};
