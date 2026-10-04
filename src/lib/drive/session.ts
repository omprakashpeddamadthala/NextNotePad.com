import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getDriveClientForUser } from "./driveClient";
import { DriveNotFoundError, DriveService } from "./driveService";
import { ensureLegacyMigrated } from "./legacyMigration";
import {
  AppError,
  resolveActiveWorkspaceId,
  resolveRequestWorkspace,
} from "./workspaceService";

export async function getDriveSession() {
  const user = await getSessionUser();
  if (!user) return null;
  const ds = new DriveService(getDriveClientForUser(user), user.id);
  await ensureLegacyMigrated(ds);
  return { user, ds };
}

export async function getDriveSessionForRequest(
  request: NextRequest,
  { validate = true }: { validate?: boolean } = {},
) {
  const session = await getDriveSession();
  if (!session) return null;
  const requested = request.nextUrl.searchParams.get("workspaceId");
  let workspaceId: string;
  if (!requested) workspaceId = await resolveActiveWorkspaceId(session.ds);
  else if (validate) workspaceId = await resolveRequestWorkspace(session.ds, requested);
  else workspaceId = requested;
  return { ...session, workspaceId, workspaceRequested: Boolean(requested) };
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

export function driveErrorResponse(err: unknown, action: string) {
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
  return NextResponse.json(
    { error: `${action} failed — Google Drive is unreachable.` },
    { status: 502 },
  );
}
