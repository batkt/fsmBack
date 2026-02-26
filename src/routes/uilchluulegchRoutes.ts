import { Router } from "express";
import {
  getUilchluulegchs,
  getUilchluulegch,
  createUilchluulegch,
  updateUilchluulegch,
  deleteUilchluulegch,
} from "../controllers/uilchluulegchController";
const router = Router();

router.get("/uilchluulegch", getUilchluulegchs);
router.get("/uilchluulegch/:id", getUilchluulegch);
router.post("/uilchluulegch", createUilchluulegch);
router.put("/uilchluulegch/:id", updateUilchluulegch);
router.delete("/uilchluulegch/:id", deleteUilchluulegch);

export default router;
