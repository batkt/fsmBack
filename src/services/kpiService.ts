import { getConn } from "../utils/db";
const getTaskModel          = require("../models/task");
const getUilchluulegchModel = require("../models/uilchluulegch");

 
export const kpiShineelekh = async (
  hariutsagchId: string,
  baiguullagiinId: string
): Promise<any> => {
  const conn               = getConn();
  const TaskModel          = getTaskModel(conn, true);

  console.log(`[KPI] Updating for user ${hariutsagchId} in company ${baiguullagiinId}`);

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

  console.log(`[KPI] Calculated: Points=${kpiOnoo}, Count=${kpiDaalgavarToo}, Avg=${kpiDundaj}, Pct=${kpiHuvv}`);

  // Use native collection to bypass schema filtering
  const { getCol } = require("../utils/db");
  const ajiltanCol = getCol("ajiltan");

  // Robust ID handling (try both string and ObjectId)
  let userQuery: any = { _id: hariutsagchId };
  try {
     const { ObjectId } = require("mongodb");
     if (ObjectId.isValid(hariutsagchId)) {
        userQuery = { $or: [{ _id: hariutsagchId }, { _id: new ObjectId(hariutsagchId) }] };
     }
  } catch (e) {}

  const result = await ajiltanCol.findOneAndUpdate(
    userQuery,
    {
      $set: {
        kpiOnoo,
        kpiDaalgavarToo,
        kpiDundaj,
        kpiHuvv,
        kpiShineelsenOgnoo: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  const updatedUser = result.value || result; // Handle both driver versions
  console.log(`[KPI] Update result for ${hariutsagchId}:`, updatedUser ? "Found" : "NOT FOUND");

  return {
    kpiOnoo,
    kpiDaalgavarToo,
    kpiDundaj,
    kpiHuvv,
    updatedUser: updatedUser || null
  };
};
