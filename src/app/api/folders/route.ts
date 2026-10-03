import { NextRequest, NextResponse } from "next/server";
import {
  getDriveSession,
  getDriveSessionWithWorkspace,
  driveErrorResponse,
} from "@/lib/drive/session";
import { createNode, getWorkspace, nodeDto } from "@/lib/drive/workspaceService";
import { createFolderSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest } from "@/lib/api/respond";

export async function POST(request: NextRequest) {
  try {
    const requestedWorkspaceId =
      request.nextUrl.searchParams.get("workspaceId");
    const session = requestedWorkspaceId
      ? await getDriveSession()
      : await getDriveSessionWithWorkspace();
    if (!session) return unauthorized();
    const parsed = createFolderSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { ds } = session;
    const workspaceId =
      requestedWorkspaceId ??
      (session as { workspaceId?: string }).workspaceId ??
      null;
    if (!workspaceId) return unauthorized();
    if (requestedWorkspaceId) await getWorkspace(ds, requestedWorkspaceId);
    const entry = await createNode(ds, workspaceId, {
      type: "folder",
      ...parsed.data,
    });
    return NextResponse.json(await nodeDto(ds, entry, workspaceId));
  } catch (err) {
    return driveErrorResponse(err, "Create folder");
  }
}
