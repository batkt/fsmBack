import { ensureFsmConn } from "../utils/fsmConn";
const getProjectModel = require("../models/project");
const getTaskModel = require("../models/task");

// All functions require explicit conn for per-org FSM DB.

export const projectJagsaalt = async (query: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getProjectModel(baseConn, true).find(query).sort({ createdAt: -1 }).lean();
};

export const projectUusgekh = async (data: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getProjectModel(baseConn, true).create(data);
};

export const projectZasakh = async (id: string, data: any, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  const ProjectModel = getProjectModel(baseConn, true);
  const result = await ProjectModel.findByIdAndUpdate(id, data, { new: true }).lean();
  
  // If color was updated, update all tasks under this project
  if (data.color) {
    await getTaskModel(baseConn, true).updateMany({ projectId: id }, { color: data.color });
  }

  return result;
};

export const projectUstgakh = async (id: string, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getProjectModel(baseConn, true).findByIdAndDelete(id);
};

export const projectNegAvakh = async (id: string, conn: any) => {
  const baseConn = ensureFsmConn(conn);
  return await getProjectModel(baseConn, true).findById(id).lean();
};
