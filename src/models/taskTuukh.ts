const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const taskTuukhSchema = new Schema(
  {
    sourceTaskId: { type: String, required: true }, 
    taskCode: { type: String }, 
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
    barilgiinId: { type: String, required: true },
    ajiltniiId: { type: String },
    ajiltniiNer: { type: String },
    uildel: { type: String }, // e.g., 'created', 'updated', 'completed', 'deleted'
    turul: { type: String, default: "task" } // e.g., 'task', 'milestone'
  },
  {
    timestamps: true
  }
);

taskTuukhSchema.index({ baiguullagiinId: 1, barilgiinId: 1, projectId: 1 });
taskTuukhSchema.index({ projectId: 1, duussanOgnoo: -1 });
taskTuukhSchema.index({ hariutsagchId: 1 });

module.exports = function a(conn: any, connectFSM = true, modelName = "taskTuukh") {
  if (!conn || !conn.kholbolt || !conn.kholboltFSM)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  conn = connectFSM && !!conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;
  return conn.model(modelName, taskTuukhSchema);
};
