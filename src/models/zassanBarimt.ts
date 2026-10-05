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

// zassanBarimt бол tureesBack-ийн эзэмшдэг цуглуулга бөгөөд "Зассан түүх"
// хуудас нь байгууллагын ҮНДСЭН (turees) баазаас уншдаг. FSM хүсэлтийн
// `req.tukhainBaaziinKholbolt` дээр `kholbolt === kholboltFSM` буюу FSM-ийн
// бааз байдаг тул энэ загварт тэр холболтыг ӨГЧ БОЛОХГҮЙ —
// utils/tureesKholbolt.ts-ийн `tureesKholboltAvakh()`-аар авсан холболтыг
// дамжуулна (services/zassanBarimtService.ts).
module.exports = function a(conn: any) {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  const undsenConn = conn.kholbolt;
  return (
    undsenConn.models["zassanBarimt"] ||
    undsenConn.model("zassanBarimt", zassanBarimtSchema)
  );
};
