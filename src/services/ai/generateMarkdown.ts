import { ApiError, fetchStream, jsonBody } from "@/lib/api/fetchJson";
import { useSettingsStore } from "@/store/settingsStore";
import type { AiProvider } from "@/types/settings";

/** Sends text to the server's `/api/ai/markdown` route — backed by Gemini or Claude (via
 *  AgentRouter) — and streams back a reformatted Markdown version as it's generated. Mirrors
 *  `correctText` (see that file for the streaming/provider/timeout rationale) but hits the
 *  Markdown-formatting endpoint instead of the grammar-correction one. `onChunk` receives just the
 *  newly-arrived delta after every network chunk, not the accumulated text-so-far — see
 *  `correctText` for why. */
export async function generateMarkdown(
  text: string,
  onChunk?: (delta: string) => void,
  providerOverride?: AiProvider,
): Promise<string> {
  const provider = providerOverride ?? useSettingsStore.getState().settings.aiProvider;
  const res = await fetchStream("/api/ai/markdown", {
    ...jsonBody("POST", { text, provider }),
    action: "AI Markdown generation",
    timeoutMs: 135000,
  });

  const reader = res.body?.getReader();
  if (!reader) {
    throw new ApiError("AI Markdown generation failed — empty response.", 502);
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
      "AI Markdown generation failed while streaming the response.",
      502,
    );
  }

  return accumulated;
}
