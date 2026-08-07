import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getSessionUserWithWorkspace } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createFileSchema } from "@/lib/validation/workspaceSchemas";
import { fileToDto } from "@/lib/dto/workspaceDto";
import { unauthorized, badRequest, notFound } from "@/lib/api/respond";
import { pushFileCreate } from "@/lib/drive/pushSync";
import { detectLanguageFromFilename } from "@/lib/constants/languages";

export async function POST(request: NextRequest) {
  const session = await getSessionUserWithWorkspace();
  if (!session) return unauthorized();

  const parsed = createFileSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);
  const { parentId, name, content, language, encoding } = parsed.data;

  const parent = parentId
    ? await prisma.folder.findFirst({ where: { id: parentId, workspaceId: session.workspaceId } })
    : null;
  if (parentId && !parent) return notFound("Parent folder not found");

  const path = `${parent?.path ?? ""}/${name}`;
  const file = await prisma.file.create({
    data: {
      workspaceId: session.workspaceId,
      parentId,
      name,
      path,
      content,
      language: language ?? detectLanguageFromFilename(name),
      encoding: encoding ?? "UTF-8",
      size: content.length,
    },
  });

  after(() => pushFileCreate(file.id));

  return NextResponse.json(fileToDto(file, true));
}
