const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const baiguullagaSchema = new Schema(
  {
    ner: { type: String, required: true },
    register: { type: String, required: true },
    khayag: { type: String },
    utas: [String],
    mail: [String],
    barilguud: [
      {
        ner: String,
        khayag: String,
        register: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = function a(conn: any, connectFSM = true, modelName = "baiguullaga") {
  if (!conn || !conn.kholbolt || !conn.kholboltFSM)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = connectFSM && !!conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;
  return conn.model(modelName, baiguullagaSchema);
};
