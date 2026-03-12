import { getConn, getErunkhiiCol } from "../utils/db";
import { ensureFsmConn } from "../utils/fsmConn";
const getTaskModel          = require("../models/task");
const getUilchluulegchModel = require("../models/uilchluulegch");

 
export const kpiShineelekh = async (
  hariutsagchId: string,
  baiguullagiinId: string,
  conn?: any
): Promise<any> => {
  const baseConn = ensureFsmConn(conn || getConn());
  const TaskModel          = getTaskModel(baseConn, true);

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
      onTimeCount++;
    }
  });

  const kpiOnoo = qualityPoints;
  const kpiDundaj = kpiDaalgavarToo > 0 ? Math.round((qualityPoints / kpiDaalgavarToo) * 100) / 100 : 0;

  const qualityScore = kpiDaalgavarToo > 0 ? ((qualityPoints / kpiDaalgavarToo) / 10) * 100 : 0;
  const timelinessScore = kpiDaalgavarToo > 0 ? (onTimeCount / kpiDaalgavarToo) * 100 : 0;
  const kpiHuvv = kpiDaalgavarToo > 0 ? Math.round((qualityScore * 0.70) + (timelinessScore * 0.30)) : 0;

  console.log(`[KPI] Calculated for ${hariutsagchId}: Tasks=${kpiDaalgavarToo}, QualityPts=${qualityPoints}, OnTime=${onTimeCount}, FinalPct=${kpiHuvv}%`);

  const ajiltanCol = getErunkhiiCol("ajiltan");
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

export const kpiShineelekhUilchluulegch = async (
  uilchluulegchId: string,
  conn?: any
): Promise<any> => {
  const baseConn = conn || getConn();
  const getProjectModel    = require("../models/project");
  const getTaskModel       = require("../models/task");
  
  const ProjectModel       = getProjectModel(baseConn, true);
  const TaskModel          = getTaskModel(baseConn, true);
  const UilchluulegchModel = getUilchluulegchModel(baseConn, true);

  let idMatch: any[] = [uilchluulegchId, uilchluulegchId.toString()];
  try {
    const { ObjectId } = require("mongodb");
    if (ObjectId.isValid(uilchluulegchId)) {
      idMatch.push(new ObjectId(uilchluulegchId));
    }
  } catch (e) {}

  console.log(`[KPI/Client] Updating for client ${uilchluulegchId}`);
  const projects = await ProjectModel.find({ 
    uilchluulegchId: { $in: idMatch } 
  }).select("_id").lean();
  const projectIds = projects.map((p: any) => p._id);

  console.log(`[KPI/Client] Found ${projects.length} projects for client ${uilchluulegchId}`);
  const tasks = await TaskModel.find({
    $or: [
      { projectId: { $in: projectIds } },
      { uilchluulegchId: { $in: idMatch } }
    ]
  }).select("uilchluulegchOnooson baraa duussanOgnoo tuluv").lean();

  console.log(`[KPI/Client] Found ${tasks.length} total tasks for client ${uilchluulegchId}`);

  let kpiDaalgavarToo = 0;
  let totalRating = 0;
  let ratedCount = 0;
  let totalOrlogo = 0;
  let activeTaskCount = 0;

  tasks.forEach((task: any) => {
    kpiDaalgavarToo++;
    if (task.uilchluulegchOnooson != null) {
      totalRating += Number(task.uilchluulegchOnooson);
      ratedCount++;
    }
    if (Array.isArray(task.baraa)) {
      task.baraa.forEach((b: any) => {
        totalOrlogo += (Number(b.niitUne) || 0);
      });
    }
    if (task.tuluv !== 'duussan' && task.tuluv !== 'tsutslagdsan') {
      activeTaskCount++;
    }
  });

  const kpiDundaj = ratedCount > 0 ? Math.round((totalRating / ratedCount) * 10) / 10 : 0;
  const kpiHuvv = ratedCount > 0 ? Math.round((totalRating / ratedCount) * 10) : 0;
  
  const clientTuluv = activeTaskCount > 0 ? 'idevhtei' : 'idevhgui';

  const updatedClient = await UilchluulegchModel.findByIdAndUpdate(
    uilchluulegchId,
    {
      $set: {
        kpiDaalgavarToo,
        kpiDundaj,
        kpiHuvv,
        kpiOrlogo: totalOrlogo,
        tuluv: clientTuluv,
        kpiShineelsenOgnoo: new Date()
      }
    },
    { new: true }
  ).lean();

  console.log(`[KPI/Client] Calculated for ${uilchluulegchId}: Tasks=${kpiDaalgavarToo}, Avg=${kpiDundaj}, Revenue=${totalOrlogo}, Tuluv=${clientTuluv}`);

  return {
    kpiDaalgavarToo,
    kpiDundaj,
    kpiOrlogo: totalOrlogo,
    tuluv: clientTuluv,
    updatedClient: updatedClient || null
  };
};

