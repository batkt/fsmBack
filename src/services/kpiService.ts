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
    $or: [
      { hariutsagchId },
      { ajiltnuud: hariutsagchId }
    ],
    baiguullagiinId,
    niitOnooson: { $ne: null, $exists: true }
  })
    .select("niitOnooson khugatsaaDuusakhOgnoo duussanOgnoo duusakhTsag")
    .lean();

  const kpiDaalgavarToo = scoredTasks.length;
  let qualityPoints = 0;
  let onTimeCount = 0;

  scoredTasks.forEach((task: any) => {
    qualityPoints += (task.niitOnooson || 0);

    const deadline = task.khugatsaaDuusakhOgnoo || task.duusakhTsag;
    const completedAt = task.duussanOgnoo;

    if (completedAt && deadline) {
      if (new Date(completedAt).getTime() <= new Date(deadline).getTime()) {
        onTimeCount++;
      }
    } else {
      // If no strict deadline, consider it on time
      onTimeCount++;
    }
  });

  const kpiOnoo = qualityPoints;
  const kpiDundaj = kpiDaalgavarToo > 0 ? Math.round((qualityPoints / kpiDaalgavarToo) * 100) / 100 : 0;

  // Sub-metrics
  const qualityScore = kpiDaalgavarToo > 0 ? ((qualityPoints / kpiDaalgavarToo) / 10) * 100 : 0;
  const timelinessScore = kpiDaalgavarToo > 0 ? (onTimeCount / kpiDaalgavarToo) * 100 : 0;

  // Weighted KPI Formula: 70% Quality, 30% Timeliness
  const kpiHuvv = kpiDaalgavarToo > 0 ? Math.round((qualityScore * 0.70) + (timelinessScore * 0.30)) : 0;

  console.log(`[KPI] Calculated for ${hariutsagchId}: Tasks=${kpiDaalgavarToo}, QualityPts=${qualityPoints}, OnTime=${onTimeCount}, FinalPct=${kpiHuvv}%`);

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
