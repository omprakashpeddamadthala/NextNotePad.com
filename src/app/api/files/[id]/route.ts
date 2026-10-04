import { NextRequest, NextResponse } from "next/server";
import {
  driveErrorResponse,
  getDriveSession,
  getDriveSessionForRequest,
} from "@/lib/drive/session";
import {
  entryToNodeDto,
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
    const session = await getDriveSessionForRequest(request, { validate: false });
    if (!session) return unauthorized();
    const { id } = await params;
    const { ds, workspaceId } = session;

    const [entry, content] = await Promise.all([
      getNode(ds, id),
      ds.readText(id),
    ]);
    if (isFolder(entry)) return notFound();

    const dto = await nodeDto(ds, entry, workspaceId);
    return NextResponse.json({
      ...dto,
      content,
    });
  } catch (err) {
    return driveErrorResponse(err, "Load file");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const parsed = updateFileSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);

    const isContentOnly =
      parsed.data.content !== undefined &&
      parsed.data.name === undefined &&
      parsed.data.parentId === undefined &&
      parsed.data.language === undefined &&
      parsed.data.hidden === undefined &&
      parsed.data.locked === undefined &&
      parsed.data.encryptionSalt === undefined &&
      parsed.data.encryptionIv === undefined;

    const session = isContentOnly
      ? await getDriveSession().then((s) => s && { ...s, workspaceId: "" })
      : await getDriveSessionForRequest(request, { validate: false });
    if (!session) return unauthorized();
    const { id } = await params;
    const { ds, workspaceId } = session;

    const entry = await updateNode(ds, workspaceId, id, parsed.data);
    const moved =
      parsed.data.name !== undefined || parsed.data.parentId !== undefined;
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

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const { id } = await params;
    await trashNode(session.ds, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return driveErrorResponse(err, "Delete file");
  }
}
