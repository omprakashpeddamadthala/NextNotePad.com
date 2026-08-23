import { ApiError, fetchStream, jsonBody } from "@/lib/api/fetchJson";

/** Sends text to the server's `/api/ai/correct` route (backed by Gemini) and streams back the
 *  grammar/spelling-corrected version as it's generated — `onChunk` is called with the
 *  accumulated text so far after every chunk, letting the caller show progress instead of a
 *  single multi-second blocking wait (free-tier Gemini latency runs into the tens of seconds).
 *  Runs server-side so the Gemini API key never reaches the browser. Resolves with the final
 *  full text once the stream ends. */
export async function correctText(
  text: string,
  onChunk?: (accumulated: string) => void,
): Promise<string> {
  const res = await fetchStream("/api/ai/correct", {
    ...jsonBody("POST", { text }),
    action: "AI grammar correction",
    timeoutMs: 45000,
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
      accumulated += decoder.decode(value, { stream: true });
      onChunk?.(accumulated);
    }
  } catch {
    throw new ApiError(
      "AI grammar correction failed while streaming the response.",
      502,
    );
  }

  return accumulated;
}
