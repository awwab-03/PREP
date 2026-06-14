import express from "express";
import {
  startInterview,
  submitAnswer,
  completeInterview,
  getInterview,
  listInterviews,
} from "../controllers/interviewController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", listInterviews);
router.post("/start", startInterview);
router.get("/:id", getInterview);
router.post("/:id/answer", submitAnswer);
router.post("/:id/complete", completeInterview);

export default router;
