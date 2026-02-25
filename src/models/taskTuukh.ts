const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const taskTuukhSchema = new Schema(
  {
    taskId: { type: String, required: true },
    projectId: { type: String, required: true },
    ner: { type: String },
    tailbar: { type: String },
    zereglel: { type: String },
    tuluv: { type: String },
    hariutsagchId: { type: String },
    ajiltnuud: [{ type: String }],
    ekhlekhTsag: { type: Date },
    duusakhTsag: { type: Date },
    khugatsaaDuusakhOgnoo: { type: Date },
    duussanOgnoo: { type: Date, default: Date.now },
    zurag: [{
      zamNer: { type: String },
      ankhNer: { type: String },
      khemjee: { type: Number },
      turul: { type: String },
      ognoo: { type: Date }
    }],
    baiguullagiinId: { type: String, required: true },
    barilgiinId: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

taskTuukhSchema.index({ baiguullagiinId: 1, barilgiinId: 1, projectId: 1 });
taskTuukhSchema.index({ projectId: 1, duussanOgnoo: -1 });
taskTuukhSchema.index({ hariutsagchId: 1 });

module.exports = function (conn: any) {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = conn.kholbolt;
  return conn.model("taskTuukh", taskTuukhSchema);
};
