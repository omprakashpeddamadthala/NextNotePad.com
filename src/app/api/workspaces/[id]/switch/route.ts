import { NextRequest, NextResponse } from "next/server";
import { getDriveSession, driveErrorResponse } from "@/lib/drive/session";
import {
  getWorkspace,
  setActiveWorkspace,
  workspaceToDto,
} from "@/lib/drive/workspaceService";
import { unauthorized } from "@/lib/api/respond";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const { id } = await params;
    const workspace = await getWorkspace(session.ds, id);
    await setActiveWorkspace(session.ds, id);
    return NextResponse.json(workspaceToDto(workspace));
  } catch (err) {
    return driveErrorResponse(err, "Switch workspace");
  }
}
