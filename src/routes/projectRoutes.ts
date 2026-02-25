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

router.get("/projects",  getProjects);
router.get("/projects/:id", getProject);
router.post("/projects", createProject);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

export default router;
