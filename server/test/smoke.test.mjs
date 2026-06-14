// End-to-end smoke test: boots an in-memory MongoDB, starts the real Express
// app, and exercises the auth → resume → ATS flow over HTTP.
// OpenAI calls degrade gracefully without a key — we assert the rest still works.
// Run with: npm test
import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri();
process.env.JWT_SECRET = "smoketest_secret";
process.env.NODE_ENV = "test";
process.env.PORT = "5099";
process.env.CLIENT_URL = "*";

await import("../server.js");
await new Promise((r) => setTimeout(r, 1200)); // let it connect + listen

const BASE = "http://localhost:5099";
let pass = 0,
  fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name} ${extra}`);
  }
};

const j = (res) => res.json();

// 1. Health
let r = await fetch(`${BASE}/api/health`);
ok("health endpoint", r.status === 200);

// 2. Register
r = await fetch(`${BASE}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Ada", email: "ada@test.com", password: "secret1" }),
});
let body = await j(r);
ok("register returns 201 + token", r.status === 201 && !!body.token, `(status ${r.status})`);
const token = body.token;

// 3. Duplicate register rejected
r = await fetch(`${BASE}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Ada", email: "ada@test.com", password: "secret1" }),
});
ok("duplicate email rejected (409)", r.status === 409);

// 4. Login wrong password
r = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "ada@test.com", password: "wrong" }),
});
ok("wrong password rejected (401)", r.status === 401);

// 5. Login correct
r = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "ada@test.com", password: "secret1" }),
});
body = await j(r);
ok("login returns token", r.status === 200 && !!body.token);

// 6. Protected route without token
r = await fetch(`${BASE}/api/resume`);
ok("protected route blocks no-token (401)", r.status === 401);

const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

// 7. /me
r = await fetch(`${BASE}/api/auth/me`, { headers: auth });
body = await j(r);
ok("/me returns user", r.status === 200 && body.user.email === "ada@test.com");

// 8. Paste resume
const resumeText =
  "Built a Lost and Found Management System using React, Node.js, Express and MongoDB. " +
  "Bachelor of Computer Science, University. Implemented JWT auth and deployed to AWS. " +
  "Strong in JavaScript, data structures and algorithms. Developed REST APIs.";
r = await fetch(`${BASE}/api/resume/paste`, {
  method: "POST",
  headers: auth,
  body: JSON.stringify({ resumeText }),
});
body = await j(r);
ok("resume paste saves + extracts skills", r.status === 201 && body.resume.skills.length > 0,
  `(skills: ${body.resume?.skills?.join(",")})`);

// 9. ATS analyze (deterministic part must work even if OpenAI key missing).
//    JD is deliberately stuffed with job-posting boilerplate to prove it's
//    excluded from the technical keyword pool.
const jd =
  "Position Overview: Software Engineer Internship. Duration 6 months. Paid. " +
  "Location: New York City, State of NY. Remote / Hybrid. Join our growing team! " +
  "Looking for a candidate skilled in React, Node.js, TypeScript, Docker and AWS. " +
  "Build REST APIs, work with PostgreSQL. System design and CI/CD required. " +
  "Strong communication and a great team player with excellent problem solving.";
r = await fetch(`${BASE}/api/ats/analyze`, {
  method: "POST",
  headers: auth,
  body: JSON.stringify({ jobDescription: jd }),
});
body = await j(r);
ok("ATS analyze returns numeric score", r.status === 200 && typeof body.score === "number",
  `(status ${r.status}, score ${body.score})`);
ok("ATS breakdown has all 5 components",
  body.breakdown &&
    ["skillMatch","keywordMatch","softSkillMatch","projectMatch","educationMatch"]
      .every(k => k in body.breakdown));
ok("ATS detects missing skills", Array.isArray(body.missingSkills) && body.missingSkills.includes("typescript"),
  `(missing: ${body.missingSkills?.join(",")})`);

// Boilerplate must NOT leak into matched/missing keywords (the reported bug).
const BOILERPLATE = ["position","overview","duration","months","paid","location","city","state","remote","team","join"];
const allKeywords = [...(body.matchedKeywords || []), ...(body.missingKeywords || [])];
const leaked = BOILERPLATE.filter((w) => allKeywords.includes(w));
ok("ATS excludes job-posting boilerplate from keywords", leaked.length === 0,
  `(leaked: ${leaked.join(",")})`);
// The JD mentions communication; the test resume doesn't — so it must surface
// as a MISSING soft skill (proving soft skills are detected & scored separately).
ok("ATS tracks soft skills separately",
  Array.isArray(body.missingSoftSkills) && body.missingSoftSkills.includes("communication"),
  `(missing soft: ${body.missingSoftSkills?.join(",")})`);

// 10. ATS latest persisted
r = await fetch(`${BASE}/api/ats/latest`, { headers: auth });
body = await j(r);
ok("ATS result persisted", r.status === 200 && body.atsResults.score >= 0);

console.log(`\n${pass} passed, ${fail} failed`);
await mongod.stop();
process.exit(fail ? 1 : 0);
