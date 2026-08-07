import { NextResponse } from "next/server";
import { getSessionUserWithWorkspace } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { folderToDto, fileToDto } from "@/lib/dto/workspaceDto";
import { unauthorized } from "@/lib/api/respond";

export async function GET() {
  const session = await getSessionUserWithWorkspace();
  if (!session) return unauthorized();

  const [folders, files, everFolderCount, everFileCount] = await Promise.all([
    prisma.folder.findMany({ where: { workspaceId: session.workspaceId, deletedAt: null } }),
    prisma.file.findMany({ where: { workspaceId: session.workspaceId, deletedAt: null } }),
    prisma.folder.count({ where: { workspaceId: session.workspaceId } }),
    prisma.file.count({ where: { workspaceId: session.workspaceId } }),
  ]);

  return NextResponse.json({
    nodes: [...folders.map(folderToDto), ...files.map((f) => fileToDto(f))],
    // True once this workspace has ever had a row (even a since-deleted one) — distinguishes
    // "brand-new account, never migrated" from "returning user who deleted everything."
    hasAnyHistory: everFolderCount > 0 || everFileCount > 0,
  });
}
