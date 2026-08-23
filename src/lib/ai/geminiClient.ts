import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

/** Lazily constructs the Gemini client from `GEMINI_API_KEY` — throws if it's unset so callers
 *  can turn that into a clean "AI isn't configured" response instead of a crash. Gemini's free
 *  tier (no card required) is why this app uses it instead of a paid-only provider. */
export function getGeminiClient(): GoogleGenAI {
  if (client) return client;
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}
