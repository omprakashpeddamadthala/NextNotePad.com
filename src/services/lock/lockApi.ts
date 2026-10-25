import type { LockOptions, LockPolicy } from "@/lib/lock/lockPolicy";
import type { AuthUser } from "@/store/authStore";

/**
 * Client for the /api/lock/* endpoints. Unlike `fetchJson`, a non-2xx reply resolves (so callers
 * can show the server's own error message, e.g. "Current lock password is incorrect."); only
 * network failures reject.
 */
export interface LockApiResult<T> {
  ok: boolean;
  data: Partial<T> & { error?: string };
}

export interface LockStatusResponse {
  authenticated: boolean;
  enabled: boolean;
  isLocked: boolean;
  policy: LockPolicy;
  pwaOnResume: boolean;
  autoTimeoutMinutes: number;
}

export interface UnlockResponse {
  success: boolean;
  locked: boolean;
  retryAfterSeconds?: number;
  user: AuthUser;
}

async function lockRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT",
  body?: unknown,
  unparsableBody: LockApiResult<T>["data"] = {},
): Promise<LockApiResult<T>> {
  const res = await fetch(`/api/lock/${path}`, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const data = (await res
    .json()
    .catch(() => unparsableBody)) as LockApiResult<T>["data"];
  return { ok: res.ok, data };
}

export const lockApi = {
  status: () => lockRequest<LockStatusResponse>("status", "GET"),
  setup: (password: string, options: Required<LockOptions>) =>
    lockRequest("setup", "POST", { password, ...options }),
  updateSettings: (options: LockOptions) =>
    lockRequest("settings", "PUT", options),
  changePassword: (currentPassword: string, newPassword: string) =>
    lockRequest("change", "POST", { currentPassword, newPassword }),
  disable: (password: string) => lockRequest("disable", "POST", { password }),
  unlock: (password: string) =>
    lockRequest<UnlockResponse>(
      "unlock",
      "POST",
      { password },
      { success: false, error: "Failed to parse response" },
    ),
};
