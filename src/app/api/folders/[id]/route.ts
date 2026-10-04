import { NextRequest, NextResponse } from "next/server";
import {
  getDriveSession,
  getDriveSessionWithWorkspace,
  driveErrorResponse,
} from "@/lib/drive/session";
import { nodeDto, trashNode, updateNode } from "@/lib/drive/workspaceService";
import { updateFolderSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest } from "@/lib/api/respond";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const requestedWorkspaceId =
      request.nextUrl.searchParams.get("workspaceId");
    const session = requestedWorkspaceId
      ? await getDriveSession()
      : await getDriveSessionWithWorkspace();
    if (!session) return unauthorized();
    const { id } = await params;
    const parsed = updateFolderSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { ds } = session;
    const workspaceId = requestedWorkspaceId
      ? (await ds.get(requestedWorkspaceId)).id
      : ("workspaceId" in session
          ? (session as unknown as { workspaceId: string }).workspaceId
          : "");
    const entry = await updateNode(ds, workspaceId, id, parsed.data);
    return NextResponse.json(await nodeDto(ds, entry, workspaceId));
  } catch (err) {
    return driveErrorResponse(err, "Update folder");
  }
}

/** Trashing a Drive folder trashes its whole subtree, so no per-descendant cascade is needed. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const { id } = await params;
    await trashNode(session.ds, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return driveErrorResponse(err, "Delete folder");
  }
}
