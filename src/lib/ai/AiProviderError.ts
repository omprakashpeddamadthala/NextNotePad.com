/** Normalized error shape both AI providers throw into — lets the route map failures to HTTP
 *  status/user-facing messages the same way regardless of which backend (Gemini SDK error,
 *  AgentRouter HTTP response) actually produced it. Never construct one with API key material in
 *  the message — callers pass through provider status/shape, not raw request/response bodies. */
export class AiProviderError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
  }
}
