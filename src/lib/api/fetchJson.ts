/**
 * Client-side fetch wrapper for the app's own `/api/*` routes.
 *
 * Every call goes through here so failures surface the same way everywhere:
 *  - a non-2xx response throws (several callers used to ignore this entirely, which turned a
 *    failed save into a silent no-op — the file looked saved but the server never got it),
 *  - a dead/unreachable server becomes a readable message instead of a bare "Failed to fetch",
 *  - a request that never comes back is aborted rather than leaving a spinner up forever.
 */

import { useApiActivityStore } from "@/store/apiActivityStore";

const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** True for the errors worth offering a "Retry" on — the request never got a real answer. */
export function isOfflineError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status === 408);
}

interface RequestOptions extends RequestInit {
  /** What the user was trying to do, used to build the error message ("Save file failed"). */
  action: string;
  timeoutMs?: number;
}

async function request(url: string, { action, timeoutMs = DEFAULT_TIMEOUT_MS, ...init }: RequestOptions) {
  // Every internal API call passes through here, so this is also where the shared progress
  // indicator is driven from — no call site has to remember to report itself.
  const activity = useApiActivityStore.getState();
  activity.begin();

  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    // fetch only rejects for network-level failures (server down, offline, DNS, abort) — never
    // for a 4xx/5xx, which is why the res.ok check below has to exist separately.
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError(`${action} timed out — the server took too long to respond.`, 408);
    }
    throw new ApiError(`${action} failed — can't reach the server. Check your connection.`, 0);
  } finally {
    activity.end();
  }

  if (!res.ok) {
    throw new ApiError(`${action} failed (${res.status}).`, res.status);
  }
  return res;
}

/** Performs the request and parses the JSON body. */
export async function fetchJson<T>(url: string, options: RequestOptions): Promise<T> {
  const res = await request(url, options);
  return res.json() as Promise<T>;
}

/** Performs the request purely for its side effect, ignoring any response body. */
export async function fetchOk(url: string, options: RequestOptions): Promise<void> {
  await request(url, options);
}

/** Performs the request and returns the raw Response for the caller to stream from — same
 *  timeout/offline-error handling as fetchJson, but for endpoints that stream a body instead
 *  of returning one JSON blob. */
export async function fetchStream(url: string, options: RequestOptions): Promise<Response> {
  return request(url, options);
}

/** Shorthand for the JSON-body-in, JSON-body-out calls that make up most of the repository. */
export function jsonBody(method: "POST" | "PATCH" | "PUT", body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
