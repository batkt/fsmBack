import { Router } from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import { authMiddleware } from "../middlewares/auth";
import { validateFSMAccess } from "../middlewares/fsmAccess";

const router = Router();

// All project routes require Bearer token authentication (from tureesBack)
router.get("/projects", authMiddleware, getProjects);
router.get("/projects/:id", authMiddleware, getProject);
// Create/Update/Delete require FSM access validation
router.post("/projects", authMiddleware, validateFSMAccess, createProject);
router.put("/projects/:id", authMiddleware, validateFSMAccess, updateProject);
router.delete("/projects/:id", authMiddleware, validateFSMAccess, deleteProject);

export default router;
