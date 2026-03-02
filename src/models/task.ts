const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const taskSchema = new Schema(
  {
    projectId: { type: String, required: true },
    taskId: { type: String, unique: true }, 
    ner: { type: String, required: true },
    tailbar: { type: String },
    zereglel: {
      type: String,
      enum: ["nen yaraltai", "yaraltai", "engiin", "baga"],
      default: "engiin"
    },
    tuluv: {
      type: String,
      enum: ["shine", "khiigdej bui", "shalga", "duussan"],
      default: "shine"
    },
    hariutsagchId: { type: String },
    ajiltnuud: [{ type: String }],
    ekhlekhTsag: { type: Date },
    duusakhTsag: { type: Date },
    ekhlekhMinute: { type: Number }, // Start minute (0-1439, minutes from midnight)
    duusakhMinute: { type: Number }, // End minute (0-1439, minutes from midnight)
    khugatsaaDuusakhOgnoo: { type: Date },
    zurag: [{
      zamNer: { type: String },
      fileNer: { type: String },
      khemjee: { type: Number },
      turul: { type: String },
      ognoo: { type: Date, default: Date.now }
    }],
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true },
    color: { type: String }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ baiguullagiinId: 1, barilgiinId: 1, projectId: 1 });
taskSchema.index({ projectId: 1, tuluv: 1 });
taskSchema.index({ hariutsagchId: 1, tuluv: 1 });
taskSchema.index({ zereglel: 1 });

module.exports = function a(conn: any, connectFSM = true, modelName = "task") {
  if (!conn || !conn.kholbolt || !conn.kholboltFSM)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = connectFSM && !!conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;
  return conn.model(modelName, taskSchema);
};
