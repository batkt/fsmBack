const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const projectSchema = new Schema(
  {
    ner: { type: String, required: true },
    tailbar: { type: String },
    tuluv: {
      type: String,
      enum: ["shine", "khiigdej bui", "duussan"],
      default: "shine"
    },
    ekhlekhOgnoo: { type: Date },
    duusakhOgnoo: { type: Date },
    udirdagchId: { type: String },
    ajiltnuud: [{ type: String }],
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true },
    taskCount: { type: Number, default: 0 },
    color: { type: String }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ baiguullagiinId: 1, barilgiinId: 1 });
projectSchema.index({ baiguullagiinId: 1, tuluv: 1 });
projectSchema.index({ udirdagchId: 1 });
projectSchema.index({ ajiltnuud: 1 });

module.exports = function a(conn: any, connectFSM = true, modelName = "project") {
  if (!conn || !conn.kholbolt || !conn.kholboltFSM)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = connectFSM && !!conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;
  return conn.model(modelName, projectSchema);
};
