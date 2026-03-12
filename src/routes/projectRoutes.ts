import { Router } from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import { authMiddleware } from "../middlewares/auth";
import { validateFSMAccess, filterFSMAccess } from "../middlewares/fsmAccess";

const router = Router();

// All project routes require Bearer token authentication (from tureesBack)
// GET routes filter by FSM access, POST/PUT/DELETE validate FSM access
router.get("/projects", authMiddleware, filterFSMAccess, getProjects);
router.get("/projects/:id", authMiddleware, filterFSMAccess, getProject);
// Create/Update/Delete require FSM access validation
router.post("/projects", authMiddleware, validateFSMAccess, createProject);
router.put("/projects/:id", authMiddleware, validateFSMAccess, updateProject);
router.delete("/projects/:id", authMiddleware, validateFSMAccess, deleteProject);

export default router;
