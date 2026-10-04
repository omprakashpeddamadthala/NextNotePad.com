import { NextResponse } from "next/server";
import { getDriveSession, driveErrorResponse } from "@/lib/drive/session";
import { loadAllWorkspaceTrees } from "@/lib/drive/workspaceService";
import { unauthorized } from "@/lib/api/respond";

export async function GET() {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const data = await loadAllWorkspaceTrees(session.ds);
    return NextResponse.json(data);
  } catch (err) {
    return driveErrorResponse(err, "Load all workspace trees");
  }
}
