import { getConn } from "../utils/db";
const getProjectModel = require("../models/project");

export const projectJagsaalt = async (query: any) => {
  return await getProjectModel(getConn()).find(query).sort({ createdAt: -1 }).lean();
};

export const projectUusgekh = async (data: any) => {
  return await getProjectModel(getConn()).create(data);
};

export const projectZasakh = async (id: string, data: any) => {
  const result = await getProjectModel(getConn()).findByIdAndUpdate(id, data, { new: true }).lean();
  
  // If color was updated, update all tasks under this project
  if (data.color) {
    const getTaskModel = require("../models/task");
    await getTaskModel(getConn()).updateMany({ projectId: id }, { color: data.color });
  }

  return result;
};

export const projectUstgakh = async (id: string) => {
  return await getProjectModel(getConn()).findByIdAndDelete(id);
};

export const projectNegAvakh = async (id: string) => {
  return await getProjectModel(getConn()).findById(id).lean();
};
