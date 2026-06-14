import {
  SKILL_DICTIONARY,
  SOFT_SKILLS,
  STOP_WORDS,
  BOILERPLATE_WORDS,
  SOFT_SKILL_TOKENS,
} from "./skills.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Deterministic ATS Scoring Engine
 * ─────────────────────────────────────────────────────────────────────────
 * The ATS score is computed entirely in application code (NOT by an LLM) so it
 * is reproducible and fully explainable in a technical interview.
 *
 * The score is intentionally dominated by TECHNICAL signal. Generic job-posting
 * boilerplate (e.g. "position", "remote", "team", "duration") is excluded
 * entirely, and soft skills carry only a small weight.
 *
 *   Technical Skill Match   55%   languages, frameworks, DBs, tools, cloud (curated dictionary)
 *   Technical Keyword Match 20%   meaningful JD keywords, boilerplate/soft-skill terms removed
 *   Soft Skill Match         5%   interpersonal skills (low weight by design)
 *   Project Match           10%   project / impact signals in the resume
 *   Education Match          10%   education signals in the resume
 *
 * Technical signal (skills + keywords) is therefore 75% of the score.
 *
 * If a job description contains none of a given category (e.g. no soft skills
 * mentioned), that component is dropped and its weight is redistributed across
 * the remaining applicable components — so the score is never penalised for
 * something the JD never asked for.
 */

const WEIGHTS = {
  skill: 0.55,
  keyword: 0.2,
  softSkill: 0.05,
  project: 0.1,
  education: 0.1,
};

const PROJECT_SIGNALS = [
  "project", "projects", "built", "build", "developed", "developing",
  "designed", "implemented", "created", "engineered", "deployed", "launched",
  "architected", "led", "optimized", "integrated", "automated",
];

const EDUCATION_SIGNALS = [
  "bachelor", "master", "phd", "b.sc", "bsc", "m.sc", "msc", "b.tech", "btech",
  "degree", "university", "college", "gpa", "cgpa", "computer science",
  "engineering", "graduated", "coursework", "diploma",
];

/** Lowercase a string for case-insensitive matching. */
const norm = (s) => (s || "").toLowerCase();

/** Match canonical entries from a {canonical: [aliases]} dictionary in text. */
function detectFromDictionary(text, dictionary) {
  const lower = norm(text);
  const found = new Set();
  for (const [canonical, aliases] of Object.entries(dictionary)) {
    for (const alias of aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#]|$)`, "i");
      if (re.test(lower)) {
        found.add(canonical);
        break;
      }
    }
  }
  return [...found];
}

/** Detect canonical TECHNICAL skills present in a block of text. */
export function extractSkills(text) {
  return detectFromDictionary(text, SKILL_DICTIONARY);
}

/** Detect canonical SOFT skills present in a block of text. */
export function extractSoftSkills(text) {
  return detectFromDictionary(text, SOFT_SKILLS);
}

/**
 * Extract meaningful TECHNICAL keywords from a job description.
 *
 * Tokens are dropped if they are stop words, job-posting boilerplate, soft-skill
 * terms, pure numbers, or too short. The remainder (technical/domain terms such
 * as "api", "backend", "scalable", "pipeline") is ranked by frequency.
 */
export function extractKeywords(text, limit = 25) {
  const tokens = norm(text)
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.]+|[.]+$/g, "")) // strip stray leading/trailing dots
    .filter(
      (t) =>
        t.length >= 3 &&
        !STOP_WORDS.has(t) &&
        !BOILERPLATE_WORDS.has(t) &&
        !SOFT_SKILL_TOKENS.has(t) &&
        !/^\d+$/.test(t)
    );

  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/** Count how many of `needles` appear in `text`; returns the matched subset. */
function matchList(text, needles) {
  const lower = norm(text);
  return needles.filter((n) => lower.includes(n));
}

/** Percentage of `target` items present in `source` (0 if target empty). */
const pct = (matched, total) => (total ? (matched / total) * 100 : 0);

/**
 * Main entry point. Compares a resume against a job description and returns the
 * full ATS analysis (score, breakdown, matched/missing items).
 */
export function computeATS(resumeText, jobDescription) {
  const resumeLower = norm(resumeText);

  // ── Technical Skill Match (55%) ──────────────────────────────────────
  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jobDescription);
  const matchedSkills = jdSkills.filter((s) => resumeSkills.includes(s));
  const missingSkills = jdSkills.filter((s) => !resumeSkills.includes(s));
  const skillScore = pct(matchedSkills.length, jdSkills.length);

  // ── Technical Keyword Match (20%) ────────────────────────────────────
  const jdKeywords = extractKeywords(jobDescription, 25);
  const matchedKeywords = jdKeywords.filter((k) => resumeLower.includes(k));
  const missingKeywords = jdKeywords.filter((k) => !resumeLower.includes(k));
  const keywordScore = pct(matchedKeywords.length, jdKeywords.length);

  // ── Soft Skill Match (5%) ────────────────────────────────────────────
  const resumeSoft = extractSoftSkills(resumeText);
  const jdSoft = extractSoftSkills(jobDescription);
  const matchedSoftSkills = jdSoft.filter((s) => resumeSoft.includes(s));
  const missingSoftSkills = jdSoft.filter((s) => !resumeSoft.includes(s));
  const softScore = pct(matchedSoftSkills.length, jdSoft.length);

  // ── Project Match (10%) ──────────────────────────────────────────────
  // 6+ distinct project/impact signals → full marks.
  const projectHits = matchList(resumeText, PROJECT_SIGNALS).length;
  const projectScore = Math.min(projectHits / 6, 1) * 100;

  // ── Education Match (10%) ─────────────────────────────────────────────
  const educationHits = matchList(resumeText, EDUCATION_SIGNALS).length;
  const educationScore = Math.min(educationHits / 2, 1) * 100;

  // ── Weighted total with dynamic normalisation ────────────────────────
  // Drop components the JD never asked for and redistribute their weight.
  const components = [
    { score: skillScore, weight: WEIGHTS.skill, applicable: jdSkills.length > 0 },
    { score: keywordScore, weight: WEIGHTS.keyword, applicable: jdKeywords.length > 0 },
    { score: softScore, weight: WEIGHTS.softSkill, applicable: jdSoft.length > 0 },
    { score: projectScore, weight: WEIGHTS.project, applicable: true },
    { score: educationScore, weight: WEIGHTS.education, applicable: true },
  ].filter((c) => c.applicable);

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0) || 1;
  const score = Math.round(
    components.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight
  );

  return {
    score,
    breakdown: {
      skillMatch: Math.round(skillScore),
      keywordMatch: Math.round(keywordScore),
      softSkillMatch: Math.round(softScore),
      projectMatch: Math.round(projectScore),
      educationMatch: Math.round(educationScore),
    },
    matchedKeywords,
    missingKeywords,
    matchedSkills,
    missingSkills,
    matchedSoftSkills,
    missingSoftSkills,
    resumeSkills,
    jdSkills,
    jdKeywords,
  };
}
