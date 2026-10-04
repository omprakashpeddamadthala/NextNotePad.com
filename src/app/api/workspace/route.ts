import { NextRequest, NextResponse } from "next/server";
import {
  driveErrorResponse,
  getDriveSessionForRequest,
} from "@/lib/drive/session";
import { loadWorkspaceTreeForClient } from "@/lib/drive/workspaceService";
import { unauthorized } from "@/lib/api/respond";

export async function GET(request: NextRequest) {
  try {
    const session = await getDriveSessionForRequest(request, { validate: false });
    if (!session) return unauthorized();
    const { ds, workspaceId, workspaceRequested } = session;
    const result = await loadWorkspaceTreeForClient(ds, workspaceId, {
      validate: workspaceRequested,
    });
    return NextResponse.json(result);
  } catch (err) {
    return driveErrorResponse(err, "Load workspace");
  }
}
