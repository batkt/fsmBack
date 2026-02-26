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

module.exports = function a(conn: any, connectFSM = true, modelName = "uilchluulegch") {
  if (!conn || !conn.kholbolt || !conn.kholboltFSM)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = connectFSM && !!conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;
  return conn.model(modelName, uilchluulegchSchema);
};
