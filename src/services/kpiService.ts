import { getConn } from "../utils/db";
const getTaskModel          = require("../models/task");
const getUilchluulegchModel = require("../models/uilchluulegch");

 
export const kpiShineelekh = async (
  hariutsagchId: string,
  baiguullagiinId: string
): Promise<any> => {
  const conn               = getConn();
  const TaskModel          = getTaskModel(conn, true);
  const AjiltanModel       = getUilchluulegchModel(conn, false, "ajiltan");

  const scoredTasks = await TaskModel.find({
    hariutsagchId,
    baiguullagiinId,
    onooson: { $ne: null, $exists: true }
  })
    .select("onooson")
    .lean();

  const kpiDaalgavarToo = scoredTasks.length;
  const kpiOnoo         = scoredTasks.reduce((sum: number, t: any) => sum + (t.onooson || 0), 0);
  const kpiDundaj       = kpiDaalgavarToo > 0 ? Math.round((kpiOnoo / kpiDaalgavarToo) * 100) / 100 : 0;
  const kpiHuvv         = Math.round(kpiDundaj * 10); 

  const updatedUser = await AjiltanModel.findByIdAndUpdate(
    hariutsagchId,
    {
      $set: {
        kpiOnoo,
        kpiDaalgavarToo,
        kpiDundaj,
        kpiHuvv,
        kpiShineelsenOgnoo: new Date()
      }
    },
    { new: true }
  ).lean();

  return {
    kpiOnoo,
    kpiDaalgavarToo,
    kpiDundaj,
    kpiHuvv,
    updatedUser
  };
};
