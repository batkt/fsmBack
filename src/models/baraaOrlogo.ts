const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

// Барааны орлогын түүх. Өмнө нь орлого авахад зөвхөн `baraa.uldegdel` нэмэгддэг
// байсан тул хэн, хэзээ, хэдийг оруулсныг буцаж харах боломжгүй байв.
const baraaOrlogoSchema = new Schema(
  {
    baraaId: { type: String, required: true },
    baraaNer: { type: String, default: "" },
    negj: { type: String, default: "shirheg" },

    // `too` нь барааны үндсэн нэгжээр (хайрцагтай бараанд хайрцгаар) илэрхийлэгдэнэ.
    too: { type: Number, required: true },
    // Хайрцагтай бараанд хэрэглэгч юу оруулснаа задлан харуулахад хэрэгтэй.
    khairtsag: { type: Number, default: 0 },
    zadgai: { type: Number, default: 0 },
    shirhegiinToo: { type: Number, default: 1 },

    // Орлогын дараах үлдэгдэл — түүхийг эргэж харахад ашиглана.
    umnukhUldegdel: { type: Number, default: 0 },
    daraakhUldegdel: { type: Number, default: 0 },

    tailbar: { type: String, default: "" },
    ognoo: { type: Date, default: Date.now },

    ajiltniiId: { type: String, default: "" },
    ajiltniiNer: { type: String, default: "" },

    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

baraaOrlogoSchema.index({ baiguullagiinId: 1, barilgiinId: 1, ognoo: -1 });
baraaOrlogoSchema.index({ baraaId: 1, ognoo: -1 });

module.exports = function a(
  conn: any,
  connectFSM = true,
  modelName = "baraaOrlogo",
) {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");

  const fsmConn =
    connectFSM && conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;

  return (
    fsmConn.models[modelName] || fsmConn.model(modelName, baraaOrlogoSchema)
  );
};
