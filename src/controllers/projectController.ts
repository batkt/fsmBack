import { Response } from "express";
import {
  projectJagsaalt,
  projectUusgekh,
  projectZasakh,
  projectUstgakh,
  projectNegAvakh,
} from "../services/projectService";

export const getProjects = async (req: any, res: Response, next: any) => {
  try {
    const query: any = {
      baiguullagiinId: req.ajiltan?.baiguullagiinId || req.query.baiguullagiinId,
    };

    if (req.query.tuluv) query.tuluv = req.query.tuluv;
    if (req.query.barilgiinId) query.barilgiinId = req.query.barilgiinId;

    const projects = await projectJagsaalt(query);
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req: any, res: Response, next: any) => {
  try {
    const project = await projectNegAvakh(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req: any, res: Response, next: any) => {
  try {
    const data = {
      ...req.body,
      baiguullagiinId: req.ajiltan?.baiguullagiinId || req.body.baiguullagiinId,
    };
    const project = await projectUusgekh(data);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: any, res: Response, next: any) => {
  try {
    const project = await projectZasakh(req.params.id, req.body);
    if (!project) return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req: any, res: Response, next: any) => {
  try {
    const project = await projectUstgakh(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });
    res.json({ success: true, message: "Төсөл амжилттай устгагдлаа" });
  } catch (err) {
    next(err);
  }
};
