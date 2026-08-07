import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getSessionUserWithWorkspace } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createFolderSchema } from "@/lib/validation/workspaceSchemas";
import { folderToDto } from "@/lib/dto/workspaceDto";
import { unauthorized, badRequest, notFound } from "@/lib/api/respond";
import { pushFolderCreate } from "@/lib/drive/pushSync";

export async function POST(request: NextRequest) {
  const session = await getSessionUserWithWorkspace();
  if (!session) return unauthorized();

  const parsed = createFolderSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);
  const { parentId, name } = parsed.data;

  const parent = parentId
    ? await prisma.folder.findFirst({ where: { id: parentId, workspaceId: session.workspaceId } })
    : null;
  if (parentId && !parent) return notFound("Parent folder not found");

  const path = `${parent?.path ?? ""}/${name}`;
  const folder = await prisma.folder.create({
    data: { workspaceId: session.workspaceId, parentId, name, path },
  });

  after(() => pushFolderCreate(folder.id));

  return NextResponse.json(folderToDto(folder));
}
