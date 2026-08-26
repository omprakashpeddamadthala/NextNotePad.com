import { getClaudeConfig } from "./claudeClient";
import { AiProviderError } from "./AiProviderError";

const AGENTROUTER_BASE_URL = "https://agentrouter.org/v1";

// AgentRouter's gateway is a drop-in ANTHROPIC_BASE_URL replacement for the official Claude Code
// CLI and rejects any request whose User-Agent doesn't match that client's wire image — every
// other candidate header (anthropic-version, anthropic-beta, x-app, etc.) was tested and found
// unnecessary. Verified directly against the live API before writing this file; there is no
// public API reference documenting this, so if AgentRouter changes their WAF fingerprint check
// this will need re-verifying the same way.
const CLAUDE_CODE_USER_AGENT = "claude-cli/2.1.158 (external, sdk-cli)";

// Claude via AgentRouter is markedly slower than Gemini for longer documents — verified: a ~9KB
// input still hadn't finished streaming at 45s. 120s gives real documents (up to the 20K char cap
// in aiSchemas.ts) room to actually complete instead of getting cut off mid-stream.
const REQUEST_TIMEOUT_MS = 120000;

interface OpenAiChatChunk {
  choices?: { delta?: { content?: string } }[];
}

/** Parses an OpenAI-compatible chat-completions SSE body (`data: {...}\n\n`, terminated by
 *  `data: [DONE]`) into plain text deltas. AgentRouter also emits a bare `data: null` heartbeat
 *  line mid-stream — skipped along with anything else that doesn't parse as a content delta. */
async function* parseOpenAiSse(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice("data:".length).trim();
      if (payload === "[DONE]" || payload === "null" || payload === "") continue;
      let parsed: OpenAiChatChunk;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }
      const text = parsed.choices?.[0]?.delta?.content;
      if (text) yield text;
    }
  }
}

function describeAgentRouterFailure(status: number): string {
  if (status === 401) return "AgentRouter rejected the request (invalid or missing API key).";
  if (status === 403) return "This AgentRouter key doesn't have access to the configured Claude model.";
  if (status === 429) return "AgentRouter is rate-limited right now.";
  if (status === 404) return "AgentRouter endpoint or model not found — check CLAUDE_MODEL.";
  return `AgentRouter request failed (${status}).`;
}

/** Streams a grammar-correction completion from Claude via AgentRouter, normalized to plain text
 *  deltas — same shape/contract as `streamGeminiCorrection` so the route can treat both providers
 *  identically. Throws AiProviderError (never the raw fetch Response or its body — the response
 *  is only ever inspected for its status code, never echoed) before yielding anything if setup or
 *  the initial request fails. */
export async function* streamClaudeCorrection(params: {
  text: string;
  systemInstruction: string;
}): AsyncGenerator<string> {
  let config: Awaited<ReturnType<typeof getClaudeConfig>>;
  try {
    config = await getClaudeConfig();
  } catch {
    throw new AiProviderError("Claude (AgentRouter) isn't configured on this server.", 503);
  }

  let res: Response;
  try {
    res = await fetch(`${AGENTROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "User-Agent": CLAUDE_CODE_USER_AGENT,
      },
      body: JSON.stringify({
        model: config.model,
        stream: true,
        max_tokens: 8192,
        temperature: 0.2,
        messages: [
          { role: "system", content: params.systemInstruction },
          { role: "user", content: params.text },
        ],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new AiProviderError("Claude (AgentRouter) request timed out.", 408);
    }
    throw new AiProviderError("Couldn't reach AgentRouter.", 502);
  }

  if (!res.ok) {
    // Status only — never forward the response body into a user-facing message or log.
    throw new AiProviderError(describeAgentRouterFailure(res.status), res.status === 401 ? 503 : res.status);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new AiProviderError("AgentRouter returned an empty response.", 502);
  }

  let sentAnyText = false;
  try {
    for await (const chunk of parseOpenAiSse(reader)) {
      sentAnyText = true;
      yield chunk;
    }
  } catch {
    throw new AiProviderError("Claude (AgentRouter) request failed while streaming the response.", 502);
  }
  if (!sentAnyText) {
    throw new AiProviderError("Claude didn't return any text.", 502);
  }
}
