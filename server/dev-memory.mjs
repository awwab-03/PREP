// Dev convenience: run the real API against a throwaway in-memory MongoDB so the
// whole app is clickable without an Atlas connection string.
// (OpenAI-powered text degrades gracefully if OPENAI_API_KEY is unset; the
//  deterministic ATS scoring still works.)
import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri();
process.env.JWT_SECRET = process.env.JWT_SECRET || "dev_in_memory_secret";
process.env.NODE_ENV = "development";
process.env.PORT = process.env.PORT || "5000";
process.env.CLIENT_URL = "*";

console.log("✓ In-memory MongoDB started");
await import("./server.js");

const shutdown = async () => {
  await mongod.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
