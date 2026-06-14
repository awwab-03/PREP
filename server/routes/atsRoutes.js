import express from "express";
import { analyzeATS, getLatestATS } from "../controllers/atsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/analyze", analyzeATS);
router.get("/latest", getLatestATS);

export default router;
