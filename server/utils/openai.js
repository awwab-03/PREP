import OpenAI from "openai";

let client = null;

/** Lazily create the OpenAI client so the server can boot without the key set. */
function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const MODEL = () => process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * Call the chat API and parse a JSON object from the response.
 * Uses response_format json_object for reliable, parseable output.
 */
async function chatJSON(system, user, { temperature = 0.5 } = {}) {
  const res = await getClient().chat.completions.create({
    model: MODEL(),
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const raw = res.choices[0]?.message?.content || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Truncate long text to keep token usage (and cost) under control. */
const clip = (text, max = 4000) =>
  (text || "").length > max ? text.slice(0, max) : text || "";

/**
 * Resume improvement suggestions + keyword recommendations, informed by the
 * deterministic ATS analysis. AI does NOT score — it only advises.
 */
export async function generateResumeFeedback({ resumeText, jobDescription, ats }) {
  const system =
    "You are an expert technical resume reviewer and ATS optimization coach. " +
    "Return concise, actionable advice. Respond ONLY with valid JSON.";

  const user = `
Resume:
"""${clip(resumeText)}"""

Job Description:
"""${clip(jobDescription, 2000)}"""

Deterministic ATS analysis (computed by our system, do not recompute):
- Score: ${ats.score}/100
- Missing skills: ${ats.missingSkills.join(", ") || "none"}
- Missing keywords: ${ats.missingKeywords.slice(0, 15).join(", ") || "none"}

Return JSON with this exact shape:
{
  "summary": "1-2 sentence overall assessment",
  "recommendations": ["specific, actionable suggestion", ...],   // 4-6 items
  "keywordRecommendations": ["keyword to add", ...],             // 4-8 items
  "strengths": ["strength", ...]                                 // 2-4 items
}`;

  return chatJSON(system, user, { temperature: 0.4 });
}

/**
 * Generate resume-aware interview questions using the resume, job description,
 * difficulty, and ATS analysis. Questions must reference the candidate's actual
 * projects/technologies/skills.
 */
export async function generateQuestions({
  resumeText,
  jobDescription,
  role,
  difficulty,
  count = 6,
}) {
  const system =
    "You are a senior technical interviewer. Generate personalized interview " +
    "questions grounded in the candidate's actual resume — reference their real " +
    "projects, technologies, and experience. Avoid generic questions. " +
    "Respond ONLY with valid JSON.";

  const user = `
Candidate resume:
"""${clip(resumeText)}"""

Target role: ${role || "Software Engineer"}
Job description:
"""${clip(jobDescription || "Not provided", 1500)}"""

Difficulty: ${difficulty}

Generate exactly ${count} questions. Mix of types: "technical", "behavioral", "project".
At least half must reference SPECIFIC projects, technologies, or skills found in the resume.

Return JSON:
{
  "questions": [
    { "question": "string", "questionType": "technical" | "behavioral" | "project" }
  ]
}`;

  const data = await chatJSON(system, user, { temperature: 0.7 });
  return Array.isArray(data.questions) ? data.questions : [];
}

/**
 * Evaluate a single interview answer across four dimensions and return scores +
 * feedback. All scores are 0–100.
 */
export async function evaluateAnswer({ question, answer, resumeText, role }) {
  const system =
    "You are a strict but fair senior technical interviewer evaluating a " +
    "candidate's answer. Be specific and reference the answer's actual content. " +
    "Respond ONLY with valid JSON.";

  const user = `
Role: ${role || "Software Engineer"}
Resume context:
"""${clip(resumeText, 1500)}"""

Question: ${question}

Candidate's answer:
"""${clip(answer, 2000)}"""

Score each dimension 0-100 and give feedback. If the answer is empty or "I don't know",
score low and explain what a strong answer would include.

Return JSON:
{
  "score": number,                 // overall 0-100
  "technicalAccuracy": number,
  "communication": number,
  "problemSolving": number,
  "completeness": number,
  "feedback": "2-4 sentences of specific feedback",
  "strengths": ["..."],            // 0-3 items
  "weaknesses": ["..."],           // 0-3 items
  "suggestions": ["..."]           // 1-3 items
}`;

  return chatJSON(system, user, { temperature: 0.3 });
}

/**
 * Optional context-aware follow-up question based on the candidate's last answer.
 */
export async function generateFollowUp({ question, answer, resumeText }) {
  const system =
    "You are a technical interviewer. Based on the candidate's previous answer, " +
    "ask ONE natural, probing follow-up question. Respond ONLY with valid JSON.";

  const user = `
Resume context:
"""${clip(resumeText, 1200)}"""

Previous question: ${question}
Candidate answer: """${clip(answer, 1500)}"""

Return JSON: { "question": "string", "questionType": "technical" | "behavioral" | "project" }`;

  const data = await chatJSON(system, user, { temperature: 0.6 });
  return data.question
    ? { question: data.question, questionType: data.questionType || "technical" }
    : null;
}
