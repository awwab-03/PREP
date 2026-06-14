import mongoose from "mongoose";

/**
 * A single Q&A turn within an interview, with optional AI evaluation.
 * Embedded inside Interview — questions/answers always belong to one session.
 */
const turnSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["technical", "behavioral", "project"],
      default: "technical",
    },
    answer: { type: String, default: "" },
    evaluation: {
      score: { type: Number },
      technicalAccuracy: { type: Number },
      communication: { type: Number },
      problemSolving: { type: Number },
      completeness: { type: Number },
      feedback: { type: String },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      suggestions: [{ type: String }],
    },
  },
  { _id: true, timestamps: true }
);

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    role: { type: String, default: "Software Engineer" },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },

    // The conversational Q&A turns.
    turns: [turnSchema],

    // Aggregate scores computed when the session is finished.
    overallScore: { type: Number },
    technicalScore: { type: Number },
    communicationScore: { type: Number },
    summaryFeedback: { type: String },
    improvementAreas: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
