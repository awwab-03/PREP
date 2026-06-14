import Resume from "../models/Resume.js";
import { computeATS } from "../utils/atsScorer.js";
import { generateResumeFeedback } from "../utils/openai.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/ats/analyze
 * Body: { jobDescription }
 *
 * 1. Computes the ATS score deterministically (in code).
 * 2. Asks the AI ONLY for human-readable suggestions/recommendations.
 * 3. Persists the latest analysis on the user's resume.
 */
export const analyzeATS = asyncHandler(async (req, res) => {
  const { jobDescription } = req.body;

  if (!jobDescription || jobDescription.trim().length < 30) {
    return res
      .status(400)
      .json({ message: "Please paste a fuller job description" });
  }

  const resume = await Resume.findOne({ user: req.user._id });
  if (!resume) {
    return res
      .status(404)
      .json({ message: "Upload a resume before running ATS analysis" });
  }

  // ── 1. Deterministic score (the defensible core) ──────────────────────
  const ats = computeATS(resume.resumeText, jobDescription);

  // ── 2. AI suggestions (advisory only — never affects the score) ───────
  let aiFeedback = { recommendations: [], keywordRecommendations: [], strengths: [], summary: "" };
  try {
    aiFeedback = await generateResumeFeedback({
      resumeText: resume.resumeText,
      jobDescription,
      ats,
    });
  } catch (err) {
    // AI is best-effort; the deterministic result still stands.
    console.error("AI feedback failed:", err.message);
  }

  const recommendations = [
    ...(aiFeedback.recommendations || []),
  ];

  // ── 3. Persist latest analysis ────────────────────────────────────────
  resume.atsResults = {
    score: ats.score,
    breakdown: ats.breakdown,
    matchedKeywords: ats.matchedKeywords,
    missingKeywords: ats.missingKeywords,
    missingSkills: ats.missingSkills,
    missingSoftSkills: ats.missingSoftSkills,
    recommendations,
    jobDescription,
    analyzedAt: new Date(),
  };
  await resume.save();

  res.json({
    score: ats.score,
    breakdown: ats.breakdown,
    matchedKeywords: ats.matchedKeywords,
    missingKeywords: ats.missingKeywords,
    matchedSkills: ats.matchedSkills,
    missingSkills: ats.missingSkills,
    matchedSoftSkills: ats.matchedSoftSkills,
    missingSoftSkills: ats.missingSoftSkills,
    resumeSkills: ats.resumeSkills,
    ai: {
      summary: aiFeedback.summary || "",
      recommendations: aiFeedback.recommendations || [],
      keywordRecommendations: aiFeedback.keywordRecommendations || [],
      strengths: aiFeedback.strengths || [],
    },
  });
});

/**
 * GET /api/ats/latest
 * Return the most recent saved ATS analysis (if any).
 */
export const getLatestATS = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ user: req.user._id });
  if (!resume || !resume.atsResults?.analyzedAt) {
    return res.status(404).json({ message: "No ATS analysis found" });
  }
  res.json({ atsResults: resume.atsResults });
});
