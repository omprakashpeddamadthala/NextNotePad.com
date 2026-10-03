import { NextResponse } from "next/server";
import {
  getDriveSessionWithWorkspace,
  driveErrorResponse,
} from "@/lib/drive/session";
import { loadWorkspaceTree } from "@/lib/drive/workspaceService";
import { unauthorized } from "@/lib/api/respond";

/** The active workspace's tree, read straight from its Drive folder (metadata only — file
 *  content is fetched lazily per file). `hasAnyHistory` is true if anything was ever created
 *  here, including items since moved to Drive's trash, so guest migration never re-triggers. */
export async function GET() {
  try {
    const session = await getDriveSessionWithWorkspace();
    if (!session) return unauthorized();
    const { ds, workspaceId } = session;
    const nodes = await loadWorkspaceTree(ds, workspaceId);
    const hasAnyHistory =
      nodes.length > 0 || (await ds.hasTrashedChildren(workspaceId));
    return NextResponse.json({ nodes, hasAnyHistory, workspaceId });
  } catch (err) {
    return driveErrorResponse(err, "Load workspace");
  }
}
