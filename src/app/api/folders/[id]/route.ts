import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getSessionUserWithWorkspace } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { updateFolderSchema } from "@/lib/validation/workspaceSchemas";
import { folderToDto } from "@/lib/dto/workspaceDto";
import { recomputeFolderSubtreePaths, softDeleteFolderSubtree, isDescendantFolder } from "@/lib/db/folderTree";
import { unauthorized, badRequest, notFound } from "@/lib/api/respond";
import { pushFolderUpdate, pushFolderDelete } from "@/lib/drive/pushSync";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getSessionUserWithWorkspace();
  if (!session) return unauthorized();
  const { id } = await params;

  const parsed = updateFolderSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);

  const existing = await prisma.folder.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!existing) return notFound();

  const data: Prisma.FolderUpdateInput = { version: { increment: 1 } };
  if (parsed.data.collapsed !== undefined) data.collapsed = parsed.data.collapsed;

  const nameChanged = parsed.data.name !== undefined && parsed.data.name !== existing.name;
  const parentChanged = parsed.data.parentId !== undefined && parsed.data.parentId !== existing.parentId;

  let newPath: string | null = null;
  if (nameChanged || parentChanged) {
    const newParentId = parsed.data.parentId !== undefined ? parsed.data.parentId : existing.parentId;
    if (newParentId === id || (newParentId && (await isDescendantFolder(id, newParentId)))) {
      return NextResponse.json({ error: "A folder can't be moved into itself or a descendant" }, { status: 400 });
    }
    const parent = newParentId
      ? await prisma.folder.findFirst({ where: { id: newParentId, workspaceId: session.workspaceId } })
      : null;
    if (newParentId && !parent) return notFound("Parent folder not found");

    const newName = parsed.data.name ?? existing.name;
    newPath = `${parent?.path ?? ""}/${newName}`;
    data.name = newName;
    data.parent = newParentId ? { connect: { id: newParentId } } : { disconnect: true };
    data.path = newPath;
  }

  const updated = await prisma.folder.update({ where: { id }, data });
  if (newPath) await recomputeFolderSubtreePaths(id, newPath);
  after(() => pushFolderUpdate(id, { parentChanged }));

  return NextResponse.json(folderToDto(updated));
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getSessionUserWithWorkspace();
  if (!session) return unauthorized();
  const { id } = await params;

  const existing = await prisma.folder.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!existing) return notFound();

  const when = new Date();
  await prisma.folder.update({ where: { id }, data: { deletedAt: when } });
  await softDeleteFolderSubtree(id, when);
  after(() => pushFolderDelete(id));

  return NextResponse.json({ ok: true });
}
