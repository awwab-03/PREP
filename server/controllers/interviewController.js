import Interview from "../models/Interview.js";
import Resume from "../models/Resume.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateQuestions,
  evaluateAnswer,
  generateFollowUp,
} from "../utils/openai.js";

/** Average a list of numbers (0 if empty), rounded. */
const avg = (nums) => {
  const valid = nums.filter((n) => typeof n === "number");
  if (!valid.length) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
};

/**
 * POST /api/interview/start
 * Body: { role, difficulty, jobDescription?, questionCount? }
 * Generates resume-aware questions and creates an in-progress interview.
 */
export const startInterview = asyncHandler(async (req, res) => {
  const { role, difficulty = "intermediate", jobDescription, questionCount = 6 } =
    req.body;

  const resume = await Resume.findOne({ user: req.user._id });
  if (!resume) {
    return res
      .status(404)
      .json({ message: "Upload a resume before starting an interview" });
  }

  const questions = await generateQuestions({
    resumeText: resume.resumeText,
    jobDescription: jobDescription || resume.atsResults?.jobDescription,
    role,
    difficulty,
    count: Math.min(Math.max(questionCount, 3), 10),
  });

  if (!questions.length) {
    return res
      .status(502)
      .json({ message: "Failed to generate questions. Try again." });
  }

  const interview = await Interview.create({
    user: req.user._id,
    resume: resume._id,
    role: role || "Software Engineer",
    difficulty,
    status: "in-progress",
    turns: questions.map((q) => ({
      question: q.question,
      questionType: q.questionType || "technical",
      answer: "",
    })),
  });

  res.status(201).json({ interview });
});

/**
 * POST /api/interview/:id/answer
 * Body: { turnId, answer, followUp? }
 * Stores + evaluates an answer. Optionally appends an AI follow-up question.
 */
export const submitAnswer = asyncHandler(async (req, res) => {
  const { turnId, answer, followUp = false } = req.body;

  const interview = await Interview.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate("resume", "resumeText");

  if (!interview) {
    return res.status(404).json({ message: "Interview not found" });
  }
  if (interview.status === "completed") {
    return res.status(400).json({ message: "Interview already completed" });
  }

  const turn = interview.turns.id(turnId);
  if (!turn) {
    return res.status(404).json({ message: "Question not found" });
  }

  const resumeText = interview.resume?.resumeText || "";

  // Evaluate the answer (AI). Best-effort: store a neutral fallback on failure.
  let evaluation;
  try {
    evaluation = await evaluateAnswer({
      question: turn.question,
      answer: answer || "",
      resumeText,
      role: interview.role,
    });
  } catch (err) {
    console.error("Evaluation failed:", err.message);
    evaluation = {
      score: 0,
      feedback: "Could not evaluate this answer automatically.",
      strengths: [],
      weaknesses: [],
      suggestions: [],
    };
  }

  turn.answer = answer || "";
  turn.evaluation = evaluation;

  // Optionally append a single context-aware follow-up as a new turn.
  let newTurn = null;
  if (followUp && answer) {
    try {
      const fu = await generateFollowUp({
        question: turn.question,
        answer,
        resumeText,
      });
      if (fu) {
        interview.turns.push({
          question: fu.question,
          questionType: fu.questionType,
          answer: "",
        });
        newTurn = interview.turns[interview.turns.length - 1];
      }
    } catch (err) {
      console.error("Follow-up failed:", err.message);
    }
  }

  await interview.save();

  res.json({
    evaluation: turn.evaluation,
    followUp: newTurn ? { id: newTurn._id, question: newTurn.question, questionType: newTurn.questionType } : null,
  });
});

/**
 * POST /api/interview/:id/complete
 * Aggregates per-answer scores into overall/technical/communication scores and
 * marks the interview completed.
 */
export const completeInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!interview) {
    return res.status(404).json({ message: "Interview not found" });
  }

  const evals = interview.turns
    .map((t) => t.evaluation)
    .filter((e) => e && typeof e.score === "number");

  interview.overallScore = avg(evals.map((e) => e.score));
  interview.technicalScore = avg(evals.map((e) => e.technicalAccuracy));
  interview.communicationScore = avg(evals.map((e) => e.communication));

  // Collect the most common improvement suggestions as headline areas.
  const areas = new Set();
  evals.forEach((e) => (e.weaknesses || []).forEach((w) => areas.add(w)));
  evals.forEach((e) => (e.suggestions || []).forEach((s) => areas.add(s)));
  interview.improvementAreas = [...areas].slice(0, 5);

  interview.summaryFeedback =
    `You answered ${evals.length} question(s) with an overall score of ` +
    `${interview.overallScore}/100. Technical: ${interview.technicalScore}, ` +
    `Communication: ${interview.communicationScore}.`;

  interview.status = "completed";
  await interview.save();

  res.json({ interview });
});

/** GET /api/interview/:id — fetch a single interview. */
export const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!interview) {
    return res.status(404).json({ message: "Interview not found" });
  }
  res.json({ interview });
});

/** GET /api/interview — list the user's interviews (newest first). */
export const listInterviews = asyncHandler(async (req, res) => {
  const interviews = await Interview.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select("role difficulty status overallScore technicalScore communicationScore createdAt turns");

  // Trim turns to a count for the list view.
  const summary = interviews.map((i) => ({
    id: i._id,
    role: i.role,
    difficulty: i.difficulty,
    status: i.status,
    overallScore: i.overallScore,
    technicalScore: i.technicalScore,
    communicationScore: i.communicationScore,
    questionCount: i.turns.length,
    createdAt: i.createdAt,
  }));

  res.json({ interviews: summary });
});
