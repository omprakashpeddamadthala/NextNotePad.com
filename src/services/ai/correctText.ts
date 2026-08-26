import { ApiError, fetchStream, jsonBody } from "@/lib/api/fetchJson";
import { useSettingsStore } from "@/store/settingsStore";
import type { AiProvider } from "@/types/settings";

/** Sends text to the server's `/api/ai/correct` route — backed by Gemini or Claude (via
 *  AgentRouter) — and streams back the grammar/spelling-corrected version as it's generated.
 *  `providerOverride` picks a specific provider for this one call (e.g. the Tools menu's
 *  per-use Gemini/Claude choice); omit it to use whatever's set in Settings > General instead.
 *  `onChunk` is called with just the newly-arrived delta after every network chunk (not the
 *  accumulated text-so-far) so the caller can append it directly instead of re-writing everything
 *  streamed in so far — letting the UI show progress instead of a single multi-second blocking
 *  wait (free-tier Gemini latency runs into the tens of seconds). Runs server-side so neither
 *  provider's API key ever reaches the browser. Resolves with the final full text once the stream
 *  ends. */
export async function correctText(
  text: string,
  onChunk?: (delta: string) => void,
  providerOverride?: AiProvider,
): Promise<string> {
  const provider = providerOverride ?? useSettingsStore.getState().settings.aiProvider;
  const res = await fetchStream("/api/ai/correct", {
    ...jsonBody("POST", { text, provider }),
    action: "AI grammar correction",
    // Longer than claudeProvider's own 120s AgentRouter timeout (the slower of the two backends)
    // so that a genuine provider-side timeout gets the chance to come back as a clean
    // AiProviderError (with a real message) instead of the client's own AbortSignal firing
    // first — its clock starts before the request even reaches the server, so an equal or
    // shorter value always races it and wins.
    timeoutMs: 135000,
  });

  const reader = res.body?.getReader();
  if (!reader) {
    throw new ApiError("AI grammar correction failed — empty response.", 502);
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
      "AI grammar correction failed while streaming the response.",
      502,
    );
  }

  return accumulated;
}
