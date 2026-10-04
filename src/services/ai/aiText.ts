import { ApiError, fetchStream, jsonBody } from "@/lib/api/fetchJson";
import { useSettingsStore } from "@/store/settingsStore";
import type { AiProvider } from "@/types/settings";

const AI_REQUEST_TIMEOUT_MS = 135_000;

type AiTextRequest = (
  text: string,
  onChunk?: (delta: string) => void,
  providerOverride?: AiProvider,
) => Promise<string>;

function aiTextRequest(endpoint: string, action: string): AiTextRequest {
  return async (text, onChunk, providerOverride) => {
    const provider =
      providerOverride ?? useSettingsStore.getState().settings.aiProvider;
    const res = await fetchStream(endpoint, {
      ...jsonBody("POST", { text, provider }),
      action,
      timeoutMs: AI_REQUEST_TIMEOUT_MS,
    });

    const reader = res.body?.getReader();
    if (!reader) throw new ApiError(`${action} failed — empty response.`, 502);

    const decoder = new TextDecoder();
    let accumulated = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const delta = decoder.decode(value, { stream: true });
        accumulated += delta;
        onChunk?.(delta);
      }
    } catch {
      throw new ApiError(
        `${action} failed while streaming the response.`,
        502,
      );
    }
    return accumulated;
  };
}

export const correctText = aiTextRequest(
  "/api/ai/correct",
  "AI grammar correction",
);
export const generateMarkdown = aiTextRequest(
  "/api/ai/markdown",
  "AI Markdown generation",
);
export const generatePrompt = aiTextRequest(
  "/api/ai/prompt",
  "AI prompt generation",
);
