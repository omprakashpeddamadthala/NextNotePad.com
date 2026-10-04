import { ApiError as GenAiApiError, GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import { getEffectiveAiConfig } from "./appConfig";
import { AiProviderError } from "./AiProviderError";

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

export async function* streamGeminiText(params: {
  text: string;
  systemInstruction: string;
}): AsyncGenerator<string> {
  const config = await getEffectiveAiConfig();
  if (!config.geminiApiKey) {
    throw new AiProviderError("Gemini isn't configured on this server.", 503);
  }
  const client = new GoogleGenAI({ apiKey: config.geminiApiKey });

  let stream: AsyncGenerator<GenerateContentResponse>;
  try {
    stream = await client.models.generateContentStream({
      model: config.geminiModel || DEFAULT_MODEL,
      contents: params.text,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 8192,
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
