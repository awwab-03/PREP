import express from "express";
import {
  uploadResume,
  getResume,
  pasteResume,
} from "../controllers/resumeController.js";
import { protect } from "../middleware/auth.js";
import { uploadResume as uploadMiddleware } from "../middleware/upload.js";

const router = express.Router();

router.use(protect); // all resume routes require auth

router.get("/", getResume);
router.post("/paste", pasteResume);

// Multer first (parses the file), then the controller.
router.post(
  "/upload",
  (req, res, next) =>
    uploadMiddleware(req, res, (err) =>
      err ? res.status(400).json({ message: err.message }) : next()
    ),
  uploadResume
);

export default router;
