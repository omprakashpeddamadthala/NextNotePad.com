import { NextRequest, NextResponse } from "next/server";
import {
  getDriveSession,
  getDriveSessionWithWorkspace,
  driveErrorResponse,
} from "@/lib/drive/session";
import { loadWorkspaceTreeForClient } from "@/lib/drive/workspaceService";
import { unauthorized } from "@/lib/api/respond";

/** The active workspace's tree, read straight from its Drive folder (metadata only — file
 *  content is fetched lazily per file). `hasAnyHistory` is true if anything was ever created
 *  here, including items since moved to Drive's trash, so guest migration never re-triggers. */
export async function GET(request: NextRequest) {
  try {
    const requestedWorkspaceId =
      request.nextUrl.searchParams.get("workspaceId");
    const session = requestedWorkspaceId
      ? await getDriveSession()
      : await getDriveSessionWithWorkspace();
    if (!session) return unauthorized();
    const { ds } = session;
    const workspaceId =
      requestedWorkspaceId ??
      (session as { workspaceId?: string }).workspaceId ??
      null;
    if (!workspaceId) return unauthorized();
    const result = await loadWorkspaceTreeForClient(ds, workspaceId, {
      validate: Boolean(requestedWorkspaceId),
    });
    return NextResponse.json(result);
  } catch (err) {
    return driveErrorResponse(err, "Load workspace");
  }
}
