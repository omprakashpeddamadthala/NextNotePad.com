import { ApiError as GenAiApiError } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import { createGeminiClient } from "./geminiClient";
import { getEffectiveAiConfig } from "./appConfig";
import { AiProviderError } from "./AiProviderError";

// Falls back to the model this app has always used, so leaving GEMINI_MODEL/AppConfig.geminiModel
// unset behaves exactly like it did before either of those existed.
const DEFAULT_MODEL = "gemini-3.6-flash";

function mapGenAiError(err: unknown): AiProviderError {
  if (err instanceof GenAiApiError) {
    if (err.status === 401 || err.status === 403) {
      return new AiProviderError("Gemini rejected the request (invalid API key).", 503);
    }
    if (err.status === 429) {
      return new AiProviderError("Gemini is rate-limited right now.", 429);
    }
    return new AiProviderError(`Gemini request failed: ${err.message}`, 502);
  }
  return new AiProviderError("Couldn't reach Gemini.", 502);
}

/** Streams a grammar-correction completion from Gemini, normalized to plain text deltas so the
 *  route can treat this identically to the Claude/AgentRouter provider. Throws AiProviderError
 *  (never the raw @google/genai error) before yielding anything if setup or the initial request
 *  fails, so the caller can map that to the right HTTP status before the streamed Response commits. */
export async function* streamGeminiCorrection(params: {
  text: string;
  systemInstruction: string;
}): AsyncGenerator<string> {
  const config = await getEffectiveAiConfig();
  if (!config.geminiApiKey) {
    throw new AiProviderError("Gemini isn't configured on this server.", 503);
  }
  const client = createGeminiClient(config.geminiApiKey);

  let stream: AsyncGenerator<GenerateContentResponse>;
  try {
    stream = await client.models.generateContentStream({
      model: config.geminiModel || DEFAULT_MODEL,
      contents: params.text,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 8192,
        // Flash defaults to "thinking" mode on, which burns several seconds of hidden reasoning
        // tokens a straight proofread never needs. gemini-3.6-flash rejects budget 0 outright
        // (400 INVALID_ARGUMENT); 1 is the smallest budget the API accepts and still collapses
        // thinking to effectively nothing.
        thinkingConfig: { thinkingBudget: 1 },
      },
    });
  } catch (err) {
    throw mapGenAiError(err);
  }

  let sentAnyText = false;
  try {
    while (true) {
      const next = await stream.next();
      if (next.done) break;
      const text = next.value.text;
      if (!text) continue;
      sentAnyText = true;
      yield text;
    }
  } catch (err) {
    throw mapGenAiError(err);
  }
  if (!sentAnyText) {
    throw new AiProviderError("Gemini didn't return any text.", 502);
  }
}
