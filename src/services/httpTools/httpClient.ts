export interface HttpRequestInput {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

export interface HttpRequestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  truncated: boolean;
  isBinary: boolean;
}

export interface HttpRequestError {
  error: string;
  durationMs?: number;
}

/** Sends a request through the server-side proxy (`/api/http-request`) instead of `fetch()`
 *  directly from the tab — a direct browser fetch would get blocked by CORS for any API that
 *  doesn't explicitly allow cross-origin calls, which is most of them. */
export async function sendHttpRequest(input: HttpRequestInput): Promise<HttpRequestResult> {
  const res = await fetch("/api/http-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as HttpRequestError).error ?? `Request failed (${res.status})`);
  return data as HttpRequestResult;
}
