import { getConn } from "../utils/db";
const getTaskModel = require("../models/task");

export const taskJagsaalt = async (query: any) => {
  return await getTaskModel(getConn()).find(query).sort({ createdAt: -1 }).lean();
};

export const taskUusgekh = async (data: any) => {
  const conn = getConn();
  const getProjectModel = require("../models/project");
  const TaskModel = getTaskModel(conn);
  const ProjectModel = getProjectModel(conn);

  const project = await ProjectModel.findById(data.projectId);
  if (!project) throw new Error("Төсөл олдсонгүй");

  const prefix = (project.ner).substring(0, 3).toUpperCase();

  const updatedProject = await ProjectModel.findByIdAndUpdate(
    data.projectId,
    { $inc: { taskCount: 1 } },
    { new: true }
  );

  const taskNumber = updatedProject.taskCount;
  const formattedNumber = taskNumber.toString().padStart(4, "0");

  data.taskId = `${prefix}-${formattedNumber}`;
  if (project.color) {
    data.color = project.color;
  }

  // Inherit baiguullagiinId and barilgiinId from project if not provided
  if (!data.baiguullagiinId && project.baiguullagiinId) {
    data.baiguullagiinId = project.baiguullagiinId;
  }
  if (!data.barilgiinId && project.barilgiinId) {
    data.barilgiinId = project.barilgiinId;
  }

  const task = await TaskModel.create(data);

  // Automatically add assigned employees to project's ajiltnuud array
  const employeesToAdd: string[] = [];
  if (data.hariutsagchId) {
    employeesToAdd.push(data.hariutsagchId);
  }
  if (data.ajiltnuud && Array.isArray(data.ajiltnuud)) {
    employeesToAdd.push(...data.ajiltnuud);
  }

  if (employeesToAdd.length > 0) {
    await ProjectModel.findByIdAndUpdate(
      data.projectId,
      { $addToSet: { ajiltnuud: { $each: employeesToAdd } } },
      { new: true }
    );
  }

  return task;
};

export const taskZasakh = async (id: string, data: any) => {
  const conn = getConn();
  const TaskModel = getTaskModel(conn);
  const getProjectModel = require("../models/project");
  const ProjectModel = getProjectModel(conn);

  // Get the task to find its projectId
  const existingTask = await TaskModel.findById(id).lean();
  if (!existingTask) return null;

  const updatedTask = await TaskModel.findByIdAndUpdate(id, data, { new: true }).lean();

  // Automatically add assigned employees to project's ajiltnuud array
  const employeesToAdd: string[] = [];
  if (data.hariutsagchId) {
    employeesToAdd.push(data.hariutsagchId);
  }
  if (data.ajiltnuud && Array.isArray(data.ajiltnuud)) {
    employeesToAdd.push(...data.ajiltnuud);
  }

  if (employeesToAdd.length > 0) {
    await ProjectModel.findByIdAndUpdate(
      existingTask.projectId,
      { $addToSet: { ajiltnuud: { $each: employeesToAdd } } },
      { new: true }
    );
  }

  return updatedTask;
};

export const taskUstgakh = async (id: string) => {
  return await getTaskModel(getConn()).findByIdAndDelete(id);
};

export const taskNegAvakh = async (id: string) => {
  return await getTaskModel(getConn()).findById(id).lean();
};
