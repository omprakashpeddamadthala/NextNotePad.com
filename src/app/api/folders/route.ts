import { NextRequest, NextResponse } from "next/server";
import {
  getDriveSession,
  getDriveSessionWithWorkspace,
  driveErrorResponse,
} from "@/lib/drive/session";
import { createNode, nodeDto } from "@/lib/drive/workspaceService";
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
    const workspaceId = requestedWorkspaceId
      ? (await ds.get(requestedWorkspaceId)).id
      : ("workspaceId" in session
          ? (session as unknown as { workspaceId: string }).workspaceId
          : "");
    const entry = await createNode(ds, workspaceId, {
      type: "folder",
      ...parsed.data,
    });
    return NextResponse.json(await nodeDto(ds, entry, workspaceId));
  } catch (err) {
    return driveErrorResponse(err, "Create folder");
  }
}
