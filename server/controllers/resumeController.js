import Resume from "../models/Resume.js";
import { extractText } from "../utils/textExtractor.js";
import { extractSkills } from "../utils/atsScorer.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/resume/upload   (multipart/form-data, field "resume")
 * Extract text from the uploaded PDF/DOCX, detect skills, and upsert the user's
 * single resume document.
 */
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const text = await extractText(req.file.buffer, req.file.mimetype);

  if (!text || text.trim().length < 30) {
    return res.status(422).json({
      message:
        "Could not extract readable text from this file. If it's a scanned PDF, try a text-based version.",
    });
  }

  const skills = extractSkills(text);

  // One resume per user — update in place if it already exists.
  const resume = await Resume.findOneAndUpdate(
    { user: req.user._id },
    {
      user: req.user._id,
      fileName: req.file.originalname,
      resumeText: text,
      skills,
      atsResults: undefined, // reset stale analysis when a new resume is uploaded
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({
    resume: {
      id: resume._id,
      fileName: resume.fileName,
      skills: resume.skills,
      resumeText: resume.resumeText,
      charCount: text.length,
    },
  });
});

/**
 * GET /api/resume
 * Return the current user's resume (text, skills, latest ATS results).
 */
export const getResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ user: req.user._id });
  if (!resume) {
    return res.status(404).json({ message: "No resume uploaded yet" });
  }
  res.json({ resume });
});

/**
 * POST /api/resume/paste
 * Allow pasting resume text directly (useful for quick demos / no file).
 */
export const pasteResume = asyncHandler(async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText || resumeText.trim().length < 30) {
    return res.status(400).json({ message: "Resume text is too short" });
  }

  const skills = extractSkills(resumeText);
  const resume = await Resume.findOneAndUpdate(
    { user: req.user._id },
    {
      user: req.user._id,
      fileName: "Pasted resume",
      resumeText,
      skills,
      atsResults: undefined,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ resume });
});
