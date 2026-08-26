import { GoogleGenAI } from "@google/genai";

/** Constructs a fresh Gemini client for the given API key. Deliberately not cached: the key can
 *  now come from the DB-backed AppConfig (Settings > AI Config, admin-only) as well as the
 *  GEMINI_API_KEY env var, and a caller-side singleton keyed to whichever key was used first
 *  would keep using a rotated-away key until the server restarted. */
export function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}
