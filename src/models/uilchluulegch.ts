const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const uilchluulegchSchema = new Schema(
  {
    ner: { type: String, required: true },
    register: { type: String },
    mail: { type: String },
    utas: [{ type: String }],
    khayag: { type: String },
    tuluv: {
      type: String,
      enum: ["idevhtei", "idevhgui"],
      default: "idevhtei"
    },
    tailbar: { type: String },
    gereeNomer: { type: String },
    gereeEkhlekh: { type: Date },
    gereeDuusakh: { type: Date },
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

uilchluulegchSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });
uilchluulegchSchema.index({ baiguullagiinId: 1, tuluv: 1 });
uilchluulegchSchema.index({ ner: "text", register: "text" });

module.exports = function (conn: any) {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = conn.kholbolt;
  return conn.model("uilchluulegch", uilchluulegchSchema);
};
