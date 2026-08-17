const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

// Ажилтны бүртгэл нь FSM-ийн биш, байгууллагын үндсэн баазад байрладаг тул
// энэ моделийг `connectFSM = false`-оор дуудна. FSM талд зөвхөн НЭР шаардлагатай
// (даалгавар, зарцуулалтын түүх дээр хариуцагчийг харуулах) учир зөвхөн
// уншихад хэрэгтэй талбаруудыг тодорхойлж, бусдыг нь `strict: false`-оор
// дамжуулна — үндсэн схем нь tureesBack дээр эзэмшигдэнэ.
const ajiltanSchema = new Schema(
  {
    ner: String,
    ovog: String,
    nevtrekhNer: String,
    utas: String,
    mail: String,
    albanTushaal: String,
    baiguullagiinId: String,
    barilguud: [String],
  },
  {
    strict: false,
    timestamps: true,
  },
);

module.exports = function a(
  conn: any,
  connectFSM = false,
  modelName = "ajiltan",
) {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");

  const songogdsonConn =
    connectFSM && conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;

  return (
    songogdsonConn.models[modelName] ||
    songogdsonConn.model(modelName, ajiltanSchema)
  );
};
