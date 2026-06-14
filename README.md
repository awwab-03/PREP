# PrepAI — AI-Powered Interview Preparation Platform

PrepAI is a full-stack SaaS application that helps job seekers prepare for technical interviews. Upload a resume, paste a job description, and PrepAI scores your resume against it like a real **ATS (Applicant Tracking System)**, surfaces missing skills and keywords, and then runs a **personalized, resume-aware AI mock interview** that evaluates every answer.

> **Stack:** React + Vite + Tailwind + shadcn-style UI · Node.js + Express · MongoDB Atlas · JWT auth · OpenAI `gpt-4o-mini`

---

## ✨ Features

| Feature | What it does |
| --- | --- |
| **Authentication** | Register / login / logout with JWT + bcrypt, protected routes |
| **Resume upload** | PDF & DOCX text extraction (`pdf-parse`, `mammoth`) + paste fallback |
| **Deterministic ATS scoring** | Weighted score **computed in code**, fully explainable (not an LLM guess) |
| **Job-description matching** | Extracts skills/keywords from a JD and diffs against the resume |
| **AI suggestions** | Missing-skill detection, keyword recommendations, resume feedback |
| **Resume-aware questions** | Interview questions reference the candidate's *real* projects & tech |
| **Mock interview chat** | Conversational, one question at a time, with per-answer evaluation |
| **AI answer evaluation** | Scores technical accuracy, communication, problem-solving, completeness |
| **Results & history** | Overall/technical/communication scores, improvement areas, past sessions |

---

## 🏛️ Architecture

```
┌────────────────────────┐        HTTPS / REST        ┌────────────────────────┐
│   React SPA (Vercel)   │  ───────────────────────▶  │  Express API (Render)  │
│  Vite · Tailwind ·     │                            │  JWT · Mongoose        │
│  React Router · Axios  │  ◀───────────────────────  │                        │
└────────────────────────┘                            └───────────┬────────────┘
                                                                   │
                                            ┌──────────────────────┼───────────────────┐
                                            ▼                                          ▼
                                  ┌───────────────────┐                    ┌───────────────────┐
                                  │  MongoDB Atlas    │                    │   OpenAI API      │
                                  │  Users / Resumes  │                    │   gpt-4o-mini     │
                                  │  Interviews       │                    │ (suggestions only)│
                                  └───────────────────┘                    └───────────────────┘
```

**Key design decision:** the ATS **score** is deterministic application logic. The LLM is used *only* for advisory content (suggestions, question generation, answer evaluation) — never to produce the score. This keeps the core metric reproducible and defensible.

### Folder structure

```
CV_PROJECT_CLD/
├── server/                     # Express backend
│   ├── server.js               # app entry, middleware, route mounting
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # User, Resume, Interview (3 collections)
│   ├── middleware/             # auth (JWT), upload (multer), errorHandler
│   ├── controllers/            # auth, resume, ats, interview
│   ├── routes/                 # REST routes
│   ├── utils/
│   │   ├── atsScorer.js        # ⭐ deterministic ATS engine
│   │   ├── skills.js           # curated skill dictionary + stop words
│   │   ├── textExtractor.js    # PDF/DOCX → text
│   │   └── openai.js           # AI: feedback, questions, evaluation
│   ├── test/smoke.test.mjs     # end-to-end integration test (in-memory Mongo)
│   └── render.yaml             # Render deployment blueprint
└── client/                     # React frontend
    ├── src/
    │   ├── pages/              # Landing, Login, Register, Dashboard, ResumeUpload,
    │   │                       # ATSResults, InterviewSetup, MockInterview, Results
    │   ├── components/ui/      # shadcn-style primitives (button, card, input, ...)
    │   ├── context/            # AuthContext (React Context API)
    │   └── lib/                # axios instance, helpers
    └── vercel.json             # SPA rewrite for client-side routing
```

---

## 🧮 The ATS Algorithm (the part to explain in interviews)

The score is **dominated by technical signal** and computed as a weighted sum of five sub-scores, each normalized to 0–100, in [`server/utils/atsScorer.js`](server/utils/atsScorer.js):

```
ATS = 0.55 · TechnicalSkillMatch     ┐
    + 0.20 · TechnicalKeywordMatch    ┘ technical signal = 75%
    + 0.05 · SoftSkillMatch
    + 0.10 · ProjectMatch
    + 0.10 · EducationMatch
```

| Sub-score | Weight | How it's computed |
| --- | --- | --- |
| **Technical Skill Match** | 55% | Canonical skills (languages, frameworks, DBs, tools, cloud) detected via a curated dictionary; % of JD skills present in the resume |
| **Technical Keyword Match** | 20% | Meaningful JD keywords ranked by frequency, **after removing stop words, job-posting boilerplate, and soft-skill terms**; % found in the resume |
| **Soft Skill Match** | 5% | Interpersonal skills (communication, teamwork, …) — deliberately low weight |
| **Project Match** | 10% | Density of project/impact signals ("built", "implemented", "deployed", …), capped |
| **Education Match** | 10% | Presence of education signals (degree, university, coursework, …) |

**Boilerplate exclusion.** Generic job-posting words — `position`, `overview`, `duration`, `months`, `paid`, `location`, `city`, `state`, `remote`, `team`, `join`, and ~150 more — live in a `BOILERPLATE_WORDS` set ([`server/utils/skills.js`](server/utils/skills.js)) and are dropped before keyword ranking, so they can never inflate the score. Soft-skill terms are likewise removed from the *technical* keyword pool and scored separately at low weight.

**Dynamic weight normalization.** If a JD never mentions a category (e.g. no soft skills), that component is dropped and its weight is redistributed across the remaining ones — the candidate is never penalised for something the posting never asked for.

**Why it's designed this way (talking points):**
- **Technical-first** — 75% of the score comes from skills + technical keywords; soft skills and boilerplate can't dominate.
- **Deterministic & reproducible** — same inputs always yield the same score; no LLM variance.
- **Explainable** — every point is traceable to matched/missing terms shown in the UI.
- **Transparent matching** — skill detection uses word-boundary regex against a hand-curated alias dictionary (e.g. `react` ← `react.js`, `reactjs`), so it handles real-world variants without hallucination.
- **Separation of concerns** — scoring is logic; the LLM only *advises*. If OpenAI is down, scoring still works (verified by the integration test).

---

## 🚀 Local development

### Prerequisites
- Node.js 18+
- A MongoDB Atlas connection string (free tier is fine)
- An OpenAI API key

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # then fill in MONGODB_URI, JWT_SECRET, OPENAI_API_KEY
npm run dev                 # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                 # starts on http://localhost:5173 (proxies /api → :5000)
```

Open http://localhost:5173.

### Run the backend integration test

```bash
cd server
npm test                    # spins up in-memory MongoDB, exercises auth → resume → ATS
```

---

## 🔐 Environment variables

### `server/.env`

| Var | Description |
| --- | --- |
| `PORT` | API port (default 5000) |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string (HS256 signing key) |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `OPENAI_API_KEY` | OpenAI key |
| `OPENAI_MODEL` | Model id (default `gpt-4o-mini`) |
| `CLIENT_URL` | Allowed CORS origin (your Vercel URL in prod) |

### `client/.env`

| Var | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of the deployed backend. Empty in dev (Vite proxy handles it). |

---

## ☁️ Deployment

### Database — MongoDB Atlas
1. Create a free M0 cluster.
2. Add a database user and allow network access (`0.0.0.0/0` for simplicity).
3. Copy the connection string into the backend `MONGODB_URI`.

### Backend — Render
1. New → **Web Service** (or Blueprint using [`server/render.yaml`](server/render.yaml)).
2. **Root directory:** `server` · **Build:** `npm install` · **Start:** `npm start`.
3. Add env vars: `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `CLIENT_URL`, `NODE_ENV=production`.
4. Health check path: `/api/health`.

### Frontend — Vercel
1. New Project → import the repo → **Root directory:** `client`.
2. Framework preset: **Vite** · Build: `npm run build` · Output: `dist`.
3. Add env var `VITE_API_URL=https://<your-render-service>.onrender.com`.
4. `client/vercel.json` already handles SPA routing.

> After deploying the frontend, set the backend's `CLIENT_URL` to the Vercel URL so CORS allows it.

---

## 🔌 API reference

All protected routes require `Authorization: Bearer <jwt>`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Create account, returns JWT |
| POST | `/api/auth/login` | – | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| POST | `/api/resume/upload` | ✅ | Upload PDF/DOCX (multipart `resume`) |
| POST | `/api/resume/paste` | ✅ | Save pasted resume text |
| GET | `/api/resume` | ✅ | Get current resume + skills + latest ATS |
| POST | `/api/ats/analyze` | ✅ | Score resume vs. job description |
| GET | `/api/ats/latest` | ✅ | Last saved ATS analysis |
| POST | `/api/interview/start` | ✅ | Generate questions, create session |
| GET | `/api/interview` | ✅ | List user's interviews |
| GET | `/api/interview/:id` | ✅ | Get one interview |
| POST | `/api/interview/:id/answer` | ✅ | Submit + evaluate an answer |
| POST | `/api/interview/:id/complete` | ✅ | Finalize, compute aggregate scores |

---

## 🛡️ Security

- Passwords hashed with **bcrypt** (salted, `select: false` so never returned).
- **JWT (HS256)** auth with protected-route middleware.
- File-type & size validation on uploads (PDF/DOCX, 5 MB cap).
- Input validation on all write endpoints.
- **Rate limiting** (global + stricter on auth) via `express-rate-limit`.
- Secrets kept in environment variables.

---

## 🧰 Tech stack

**Frontend:** React 18, Vite, React Router, Axios, Tailwind CSS, shadcn-style components, lucide-react, React Context API
**Backend:** Node.js, Express, Mongoose, JWT, bcryptjs, multer, pdf-parse, mammoth, express-rate-limit
**AI:** OpenAI `gpt-4o-mini`
**Infra:** Vercel (frontend) · Render (backend) · MongoDB Atlas
