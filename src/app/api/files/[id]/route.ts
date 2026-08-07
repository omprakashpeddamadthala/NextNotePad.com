import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getSessionUserWithWorkspace } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { updateFileSchema } from "@/lib/validation/workspaceSchemas";
import { fileToDto } from "@/lib/dto/workspaceDto";
import { unauthorized, badRequest, notFound } from "@/lib/api/respond";
import { pushFileUpdate, pushFileDelete } from "@/lib/drive/pushSync";
import { detectLanguageFromFilename } from "@/lib/constants/languages";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getSessionUserWithWorkspace();
  if (!session) return unauthorized();
  const { id } = await params;

  const file = await prisma.file.findFirst({
    where: { id, workspaceId: session.workspaceId, deletedAt: null },
  });
  if (!file) return notFound();

  return NextResponse.json(fileToDto(file, true));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getSessionUserWithWorkspace();
  if (!session) return unauthorized();
  const { id } = await params;

  const parsed = updateFileSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);

  const existing = await prisma.file.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!existing) return notFound();

  const data: Prisma.FileUpdateInput = { version: { increment: 1 } };
  if (parsed.data.content !== undefined) {
    data.content = parsed.data.content;
    data.size = parsed.data.content.length;
  }
  if (parsed.data.language !== undefined) data.language = parsed.data.language;
  if (parsed.data.encoding !== undefined) data.encoding = parsed.data.encoding;

  const nameChanged = parsed.data.name !== undefined && parsed.data.name !== existing.name;
  const parentChanged = parsed.data.parentId !== undefined && parsed.data.parentId !== existing.parentId;
  if (nameChanged || parentChanged) {
    const newParentId = parsed.data.parentId !== undefined ? parsed.data.parentId : existing.parentId;
    const parent = newParentId
      ? await prisma.folder.findFirst({ where: { id: newParentId, workspaceId: session.workspaceId } })
      : null;
    if (newParentId && !parent) return notFound("Parent folder not found");

    const newName = parsed.data.name ?? existing.name;
    data.name = newName;
    data.parent = newParentId ? { connect: { id: newParentId } } : { disconnect: true };
    data.path = `${parent?.path ?? ""}/${newName}`;

    // Renamed but no explicit language override in this request — keep it in sync with the new
    // extension (e.g. .txt -> .md), matching what the local/guest rename path already does.
    if (nameChanged && parsed.data.language === undefined) {
      data.language = detectLanguageFromFilename(newName);
    }
  }

  const updated = await prisma.file.update({ where: { id }, data });
  after(() => pushFileUpdate(id, { parentChanged }));
  return NextResponse.json(fileToDto(updated, true));
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getSessionUserWithWorkspace();
  if (!session) return unauthorized();
  const { id } = await params;

  const existing = await prisma.file.findFirst({ where: { id, workspaceId: session.workspaceId } });
  if (!existing) return notFound();

  await prisma.file.update({ where: { id }, data: { deletedAt: new Date() } });
  after(() => pushFileDelete(id));
  return NextResponse.json({ ok: true });
}
