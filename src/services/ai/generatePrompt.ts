import { ApiError, fetchStream, jsonBody } from "@/lib/api/fetchJson";
import { useSettingsStore } from "@/store/settingsStore";
import type { AiProvider } from "@/types/settings";

/** Sends text to the server's `/api/ai/prompt` route — backed by Gemini or Claude (via
 *  AgentRouter) — and streams back an AI-ready prompt derived from it as it's generated. Mirrors
 *  `correctText`/`generateMarkdown` (see `correctText` for the streaming/provider/timeout
 *  rationale) but hits the prompt-generation endpoint instead. `onChunk` receives just the
 *  newly-arrived delta after every network chunk, not the accumulated text-so-far — see
 *  `correctText` for why. */
export async function generatePrompt(
  text: string,
  onChunk?: (delta: string) => void,
  providerOverride?: AiProvider,
): Promise<string> {
  const provider = providerOverride ?? useSettingsStore.getState().settings.aiProvider;
  const res = await fetchStream("/api/ai/prompt", {
    ...jsonBody("POST", { text, provider }),
    action: "AI prompt generation",
    timeoutMs: 135000,
  });

  const reader = res.body?.getReader();
  if (!reader) {
    throw new ApiError("AI prompt generation failed — empty response.", 502);
  }

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
      "AI prompt generation failed while streaming the response.",
      502,
    );
  }

  return accumulated;
}
