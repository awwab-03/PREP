import mongoose from "mongoose";

/**
 * Resume document.
 * Stores the extracted resume text plus the most recent ATS analysis the user
 * ran against a job description. We keep a single (latest) ATS result here for
 * simplicity — no multi-resume / history requirement.
 */
const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: { type: String },
    resumeText: { type: String, required: true },

    // Skills/keywords extracted from the resume text (deterministic, in-code).
    skills: [{ type: String }],

    // Latest ATS analysis (resume vs. a pasted job description).
    atsResults: {
      score: { type: Number },
      breakdown: {
        skillMatch: { type: Number },
        keywordMatch: { type: Number },
        softSkillMatch: { type: Number },
        projectMatch: { type: Number },
        educationMatch: { type: Number },
      },
      matchedKeywords: [{ type: String }],
      missingKeywords: [{ type: String }],
      missingSkills: [{ type: String }],
      missingSoftSkills: [{ type: String }],
      recommendations: [{ type: String }],
      jobDescription: { type: String },
      analyzedAt: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);
