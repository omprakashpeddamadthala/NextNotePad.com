import { NextRequest, NextResponse } from "next/server";
import {
  driveErrorResponse,
  getDriveSession,
  getDriveSessionForRequest,
} from "@/lib/drive/session";
import { nodeDto, trashNode, updateNode } from "@/lib/drive/workspaceService";
import { updateFolderSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest } from "@/lib/api/respond";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getDriveSessionForRequest(request);
    if (!session) return unauthorized();
    const { id } = await params;
    const parsed = updateFolderSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { ds, workspaceId } = session;
    const entry = await updateNode(ds, workspaceId, id, parsed.data);
    return NextResponse.json(await nodeDto(ds, entry, workspaceId));
  } catch (err) {
    return driveErrorResponse(err, "Update folder");
  }
}

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
