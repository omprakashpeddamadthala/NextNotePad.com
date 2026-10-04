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

export function isOfflineError(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.status === 0 || error.status === 408)
  );
}

export interface RequestOptions extends RequestInit {
  action: string;
  timeoutMs?: number;
  background?: boolean;
}

async function request(
  url: string,
  {
    action,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    background = false,
    signal,
    ...init
  }: RequestOptions,
) {
  const activity = useApiActivityStore.getState();
  if (!background) activity.begin(action);

  let res: Response;
  try {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    res = await fetch(url, {
      ...init,
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
    });
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      if (signal?.aborted) throw err;
      throw new ApiError(
        `${action} timed out — the server took too long to respond.`,
        408,
      );
    }
    throw new ApiError(
      `${action} failed — can't reach the server. Check your connection.`,
      0,
    );
  } finally {
    if (!background) activity.end(action);
  }

  if (!res.ok) {
    throw new ApiError(`${action} failed (${res.status}).`, res.status);
  }
  return res;
}

export async function fetchJson<T>(
  url: string,
  options: RequestOptions,
): Promise<T> {
  const res = await request(url, options);
  return res.json() as Promise<T>;
}

export async function fetchOk(
  url: string,
  options: RequestOptions,
): Promise<void> {
  await request(url, options);
}

export async function fetchStream(
  url: string,
  options: RequestOptions,
): Promise<Response> {
  return request(url, options);
}

export function jsonBody(
  method: "POST" | "PATCH" | "PUT",
  body: unknown,
): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
