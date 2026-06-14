/**
 * Vocabularies used by the deterministic ATS engine.
 *
 * The engine is intentionally driven by hand-curated lists (not an LLM) so skill
 * detection and scoring are explainable and reproducible in a technical interview.
 *
 *  - SKILL_DICTIONARY   canonical TECHNICAL skills → aliases (the highest-weighted signal)
 *  - SOFT_SKILLS        soft/interpersonal skills (low weight, scored separately)
 *  - BOILERPLATE_WORDS  generic job-posting noise — excluded from scoring entirely
 *  - STOP_WORDS         ordinary English stop words
 */

// ─────────────────────────────────────────────────────────────────────────────
// TECHNICAL skills: languages, frameworks, databases, tools, cloud, concepts.
// These drive the bulk of the ATS score.
// ─────────────────────────────────────────────────────────────────────────────
export const SKILL_DICTIONARY = {
  // Languages
  javascript: ["javascript", "js", "es6", "ecmascript"],
  typescript: ["typescript", "ts"],
  python: ["python", "py"],
  java: ["java"],
  "c++": ["c++", "cpp"],
  "c#": ["c#", "csharp", "c sharp"],
  c: ["c language", "ansi c"],
  go: ["golang", "go lang"],
  ruby: ["ruby"],
  php: ["php"],
  swift: ["swift"],
  kotlin: ["kotlin"],
  rust: ["rust"],
  scala: ["scala"],
  dart: ["dart"],
  sql: ["sql"],
  r: ["r language"],
  matlab: ["matlab"],

  // Frontend
  react: ["react", "react.js", "reactjs"],
  "next.js": ["next.js", "nextjs", "next js"],
  vue: ["vue", "vue.js", "vuejs"],
  angular: ["angular", "angularjs"],
  svelte: ["svelte", "sveltekit"],
  redux: ["redux"],
  tailwind: ["tailwind", "tailwindcss", "tailwind css"],
  bootstrap: ["bootstrap"],
  html: ["html", "html5"],
  css: ["css", "css3"],
  sass: ["sass", "scss"],
  "react native": ["react native"],
  flutter: ["flutter"],
  vite: ["vite"],
  webpack: ["webpack"],

  // Backend
  "node.js": ["node.js", "nodejs", "node js", "node"],
  express: ["express", "express.js", "expressjs"],
  django: ["django"],
  flask: ["flask"],
  fastapi: ["fastapi"],
  spring: ["spring", "spring boot", "springboot"],
  "asp.net": ["asp.net", "asp net", "dotnet", ".net"],
  laravel: ["laravel"],
  graphql: ["graphql"],
  rest: ["rest", "rest api", "restful", "rest apis"],
  grpc: ["grpc"],

  // Databases
  mongodb: ["mongodb", "mongo", "mongoose"],
  postgresql: ["postgresql", "postgres", "psql"],
  mysql: ["mysql"],
  sqlite: ["sqlite"],
  redis: ["redis"],
  firebase: ["firebase", "firestore"],
  dynamodb: ["dynamodb"],
  elasticsearch: ["elasticsearch", "elastic search"],
  cassandra: ["cassandra"],

  // Cloud / DevOps / Infra
  aws: ["aws", "amazon web services", "ec2", "s3", "lambda"],
  azure: ["azure"],
  gcp: ["gcp", "google cloud"],
  docker: ["docker"],
  kubernetes: ["kubernetes", "k8s"],
  "ci/cd": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
  git: ["git", "github", "gitlab", "version control", "bitbucket"],
  jenkins: ["jenkins"],
  terraform: ["terraform"],
  ansible: ["ansible"],
  nginx: ["nginx"],
  kafka: ["kafka"],
  rabbitmq: ["rabbitmq"],
  linux: ["linux", "unix", "bash", "shell scripting"],
  vercel: ["vercel"],
  netlify: ["netlify"],
  heroku: ["heroku"],

  // AI / Data
  "machine learning": ["machine learning", "ml"],
  "deep learning": ["deep learning"],
  tensorflow: ["tensorflow"],
  pytorch: ["pytorch"],
  keras: ["keras"],
  "scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
  pandas: ["pandas"],
  numpy: ["numpy"],
  spark: ["spark", "apache spark"],
  hadoop: ["hadoop"],
  nlp: ["nlp", "natural language processing"],
  "computer vision": ["computer vision", "opencv"],
  openai: ["openai", "gpt", "llm", "large language model"],
  tableau: ["tableau"],
  "power bi": ["power bi", "powerbi"],

  // Tools / Testing / Practices
  jira: ["jira"],
  postman: ["postman"],
  figma: ["figma"],
  "data structures": ["data structures", "dsa"],
  algorithms: ["algorithms", "algorithm"],
  "system design": ["system design"],
  "object oriented": ["object oriented", "oop"],
  agile: ["agile", "scrum", "kanban"],
  testing: ["unit testing", "jest", "mocha", "cypress", "pytest", "selenium", "playwright", "tdd"],
  microservices: ["microservices", "micro services"],
  websockets: ["websocket", "websockets", "socket.io"],
  jwt: ["jwt", "json web token"],
};

// ─────────────────────────────────────────────────────────────────────────────
// SOFT skills: scored at LOW weight (mentioning them helps only a little).
// Stored as canonical phrases → aliases for detection.
// ─────────────────────────────────────────────────────────────────────────────
export const SOFT_SKILLS = {
  communication: ["communication", "communicate", "verbal", "written communication"],
  teamwork: ["teamwork", "team player", "collaborative", "collaboration", "cross-functional"],
  leadership: ["leadership", "lead", "mentoring", "mentorship"],
  "problem solving": ["problem solving", "problem-solving", "analytical", "critical thinking"],
  adaptability: ["adaptability", "adaptable", "flexible", "flexibility"],
  "time management": ["time management", "organized", "organization", "prioritization"],
  creativity: ["creativity", "creative", "innovative", "innovation"],
  "attention to detail": ["attention to detail", "detail oriented", "detail-oriented"],
  "work ethic": ["work ethic", "self-motivated", "self motivated", "proactive", "ownership"],
  interpersonal: ["interpersonal", "stakeholder", "customer-facing"],
};

// ─────────────────────────────────────────────────────────────────────────────
// BOILERPLATE: generic job-posting words with no signal. Excluded entirely so
// they can never inflate the keyword score.
// ─────────────────────────────────────────────────────────────────────────────
export const BOILERPLATE_WORDS = new Set([
  // Posting structure
  "position", "positions", "overview", "summary", "description", "responsibilities",
  "responsibility", "requirements", "requirement", "qualifications", "qualification",
  "duties", "role", "roles", "title", "posting", "listing", "details", "detail",
  "about", "introduction", "objective", "scope", "purpose",
  // Logistics
  "duration", "month", "months", "week", "weeks", "weekly", "day", "days", "hour",
  "hours", "year", "years", "term", "period", "start", "date", "deadline",
  "paid", "unpaid", "salary", "compensation", "stipend", "pay", "wage", "rate",
  "benefits", "benefit", "perks", "bonus", "equity", "pto", "vacation", "insurance",
  // Location / arrangement
  "location", "located", "city", "state", "country", "region", "area", "address",
  "remote", "hybrid", "onsite", "on-site", "office", "relocation", "onsite",
  "fulltime", "full-time", "parttime", "part-time", "contract", "permanent",
  "internship", "intern", "interns", "co-op", "coop", "apprenticeship", "freelance",
  // Org / people
  "team", "teams", "join", "joining", "company", "companies", "startup", "startups",
  "organization", "organisation", "department", "division", "group", "firm", "client",
  "clients", "employer", "employee", "employees", "staff", "colleague", "colleagues",
  "candidate", "candidates", "applicant", "applicants", "people", "individual",
  // Application / HR
  "apply", "application", "applications", "hiring", "hire", "hires", "recruiter",
  "recruiting", "recruitment", "onboarding", "interview", "interviews", "offer",
  "employment", "opportunity", "opportunities", "opening", "openings", "vacancy",
  "visa", "sponsorship", "authorization", "authorisation", "eligible", "eligibility",
  "authorized", "authorised", "diversity", "inclusion", "diverse", "equal",
  "culture", "values", "mission", "vision", "perk",
  // Generic filler often surfacing as "keywords"
  "experience", "experiences", "background", "knowledge", "understanding", "ability",
  "abilities", "skill", "skills", "expertise", "proficiency", "proficient",
  "familiarity", "familiar", "exposure", "passion", "passionate", "interest",
  "interested", "enthusiasm", "motivated", "eager", "willing", "willingness",
  "looking", "seeking", "ideal", "preferred", "required", "must", "plus", "nice",
  "bonus", "strong", "excellent", "good", "great", "solid", "deep", "broad",
  "fast", "paced", "fast-paced", "dynamic", "growing", "leading", "world-class",
  "cutting", "edge", "cutting-edge", "state-of-the-art", "environment", "workplace",
  "responsible", "ensure", "ensuring", "help", "helping", "support", "supporting",
  "work", "working", "based", "across", "within", "including", "include", "includes",
  "various", "etc", "able", "using", "use", "used", "new", "existing", "related",
  "relevant", "appropriate", "effective", "effectively", "efficiently", "successfully",
  // Generic role/title words (too generic to be meaningful keywords)
  "software", "engineer", "engineers", "developer", "developers", "programmer",
  "programmers", "build", "building", "builds", "develop", "developing", "designs",
  "designing", "maintain", "maintaining", "create", "creating", "manage", "managing",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Ordinary English stop words.
// ─────────────────────────────────────────────────────────────────────────────
export const STOP_WORDS = new Set([
  "the","and","for","with","you","your","our","are","will","have","has","this",
  "that","from","they","their","what","when","who","how","all","can","not","but",
  "into","out","then","them","than","more","also","about","would","could","should",
  "we","a","an","to","of","in","on","is","be","as","at","by","or","it","if","up",
  "we're","you'll","you're","its","his","her","she","him","do","does","did","been",
  "being","were","was","am","any","each","every","both","few","most","other","some",
  "such","only","own","same","so","too","very","just","there","here","where","why",
  "which","while","after","before","over","under","again","further","once","per",
]);

/**
 * Flatten the soft-skill aliases into a set of individual word tokens so the
 * keyword extractor can exclude them from the TECHNICAL keyword pool.
 */
export const SOFT_SKILL_TOKENS = new Set(
  Object.values(SOFT_SKILLS)
    .flat()
    .flatMap((phrase) => phrase.split(/[\s-]+/))
    .filter((w) => w.length >= 3)
);
