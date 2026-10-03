import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getDriveClientForUser } from "./driveClient";
import { DriveNotFoundError, DriveService } from "./driveService";
import { ensureLegacyMigrated } from "./legacyMigration";
import { AppError, resolveActiveWorkspaceId } from "./workspaceService";

/** Authenticated user + their Drive. Every application-data route goes through this. */
export async function getDriveSession() {
  const user = await getSessionUser();
  if (!user) return null;
  const ds = new DriveService(getDriveClientForUser(user), user.id);
  await ensureLegacyMigrated(ds);
  return { user, ds };
}

export async function getDriveSessionWithWorkspace() {
  const session = await getDriveSession();
  if (!session) return null;
  return {
    ...session,
    workspaceId: await resolveActiveWorkspaceId(session.ds),
  };
}

function googleStatus(err: unknown): number | null {
  const e = err as {
    code?: number | string;
    status?: number;
    response?: { status?: number; data?: { error?: string } };
  };
  if (e?.response?.data?.error === "invalid_grant") return 401;
  const s = Number(e?.response?.status ?? e?.status ?? e?.code);
  return Number.isFinite(s) && s >= 400 ? s : null;
}

/** Maps service/Drive failures onto the JSON error shape the client's `fetchJson` expects. */
export function driveErrorResponse(err: unknown, action: string) {
  if (err instanceof SyntaxError)
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  if (err instanceof AppError)
    return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof DriveNotFoundError)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const status = googleStatus(err);
  if (status === 401 || status === 403) {
    return NextResponse.json(
      {
        error:
          "Google Drive access was revoked or expired. Please sign in again.",
      },
      { status: 401 },
    );
  }
  console.error(`${action} failed:`, err);
  if (status === 429)
    return NextResponse.json(
      { error: "Google Drive is rate-limiting requests. Try again shortly." },
      { status: 503 },
    );
  if (status !== null || isNetworkError(err))
    return NextResponse.json(
      { error: `${action} failed — Google Drive is unreachable.` },
      { status: 502 },
    );
  return NextResponse.json(
    { error: `${action} failed.` },
    { status: 500 },
  );
}

function isNetworkError(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code;
  return (
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT"
  );
}
