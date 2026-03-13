const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);

const ajiltanKpiSchema = new Schema(
  {
    ajiltniiId: { type: String, required: true },
    baiguullagiinId: { type: String, required: true },
    kpiOnoo: { type: Number, default: 0 },
    kpiDaalgavarToo: { type: Number, default: 0 },
    kpiDundaj: { type: Number, default: 0 },
    kpiHuvv: { type: Number, default: 0 },
    kpiShineelsenOgnoo: { type: Date, default: Date.now },
  },
  {
    timestamps: true
  }
);

ajiltanKpiSchema.index({ ajiltniiId: 1, baiguullagiinId: 1 });

module.exports = function a(conn: any, connectFSM = true, modelName = "ajiltanKpi") {
  if (!conn || !conn.kholbolt)
    throw new Error("Холболтын мэдээлэл заавал бөглөх шаардлагатай!");
  
  const fsmConn = connectFSM && conn.kholboltFSM ? conn.kholboltFSM : conn.kholbolt;

  return fsmConn.model(modelName, ajiltanKpiSchema);
};
