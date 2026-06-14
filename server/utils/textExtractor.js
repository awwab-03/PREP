import { createRequire } from "module";
import mammoth from "mammoth";

// pdf-parse is CommonJS and ships an index that runs a debug file when imported
// directly; require the library entry point to avoid that side effect.
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

/**
 * Extract plain text from an uploaded resume buffer.
 * @param {Buffer} buffer  raw file bytes (from multer memory storage)
 * @param {string} mimetype  file mimetype
 * @returns {Promise<string>} extracted text
 */
export async function extractText(buffer, mimetype) {
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return cleanText(data.text);
  }

  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value);
  }

  throw new Error("Unsupported file type. Please upload a PDF or DOCX.");
}

/** Normalize whitespace so downstream parsing is consistent. */
function cleanText(text) {
  return (text || "")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
