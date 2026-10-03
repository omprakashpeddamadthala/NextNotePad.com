import { NextRequest, NextResponse } from "next/server";
import {
  getDriveSession,
  getDriveSessionWithWorkspace,
  driveErrorResponse,
} from "@/lib/drive/session";
import {
  assertNodeInWorkspace,
  entryToNodeDto,
  getWorkspace,
  getNode,
  isFolder,
  nodeDto,
  trashNode,
  updateNode,
} from "@/lib/drive/workspaceService";
import { updateFileSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest, notFound } from "@/lib/api/respond";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const requestedWorkspaceId =
      request.nextUrl.searchParams.get("workspaceId");
    const session = requestedWorkspaceId
      ? await getDriveSession()
      : await getDriveSessionWithWorkspace();
    if (!session) return unauthorized();
    const { id } = await params;
    const { ds } = session;
    const workspaceId =
      requestedWorkspaceId ??
      (session as { workspaceId?: string }).workspaceId ??
      null;
    if (!workspaceId) return unauthorized();
    if (requestedWorkspaceId) await getWorkspace(ds, requestedWorkspaceId);
    const entry = await getNode(ds, id);
    if (isFolder(entry)) return notFound();
    await assertNodeInWorkspace(ds, entry, workspaceId);
    const content = await ds.readText(id);
    return NextResponse.json({
      ...(await nodeDto(ds, entry, workspaceId)),
      content,
    });
  } catch (err) {
    return driveErrorResponse(err, "Load file");
  }
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
    const parsed = updateFileSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { ds } = session;
    const workspaceId =
      requestedWorkspaceId ??
      (session as { workspaceId?: string }).workspaceId ??
      null;
    if (!workspaceId) return unauthorized();
    if (requestedWorkspaceId) await getWorkspace(ds, requestedWorkspaceId);
    const entry = await updateNode(ds, workspaceId, id, parsed.data, "file");
    const moved =
      parsed.data.name !== undefined || parsed.data.parentId !== undefined;
    // Content-only saves (autosave) skip the parent walk — the client already knows the path.
    const dto = moved
      ? await nodeDto(ds, entry, workspaceId)
      : entryToNodeDto(
          entry,
          entry.parents[0] === workspaceId ? null : (entry.parents[0] ?? null),
          "",
        );
    return NextResponse.json(dto);
  } catch (err) {
    return driveErrorResponse(err, "Save file");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const requestedWorkspaceId =
      request.nextUrl.searchParams.get("workspaceId");
    const session = requestedWorkspaceId
      ? await getDriveSession()
      : await getDriveSessionWithWorkspace();
    if (!session) return unauthorized();
    const { id } = await params;
    const workspaceId =
      requestedWorkspaceId ??
      (session as { workspaceId?: string }).workspaceId ??
      null;
    if (!workspaceId) return unauthorized();
    if (requestedWorkspaceId)
      await getWorkspace(session.ds, requestedWorkspaceId);
    await trashNode(session.ds, workspaceId, id, "file");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return driveErrorResponse(err, "Delete file");
  }
}
