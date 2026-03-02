import { Router } from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// All project routes require Bearer token authentication (from tureesBack)
router.get("/projects", authMiddleware, getProjects);
router.get("/projects/:id", authMiddleware, getProject);
router.post("/projects", authMiddleware, createProject);
router.put("/projects/:id", authMiddleware, updateProject);
router.delete("/projects/:id", authMiddleware, deleteProject);

export default router;
