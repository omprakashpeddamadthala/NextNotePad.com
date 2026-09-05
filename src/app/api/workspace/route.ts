import { NextResponse } from "next/server";
import { getSessionUserWithWorkspace } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { folderToDto, fileToDto } from "@/lib/dto/workspaceDto";
import { unauthorized, serverError } from "@/lib/api/respond";

export async function GET() {
  try {
    const session = await getSessionUserWithWorkspace();
    if (!session) return unauthorized();

    const folders = await prisma.folder.findMany({ where: { workspaceId: session.workspaceId, deletedAt: null } });
    const files = await prisma.file.findMany({ where: { workspaceId: session.workspaceId, deletedAt: null } });

    let hasAnyHistory = folders.length > 0 || files.length > 0;
    if (!hasAnyHistory) {
      const everFolderCount = await prisma.folder.count({ where: { workspaceId: session.workspaceId } });
      const everFileCount = everFolderCount > 0 ? 1 : await prisma.file.count({ where: { workspaceId: session.workspaceId } });
      hasAnyHistory = everFolderCount > 0 || everFileCount > 0;
    }

    return NextResponse.json({
      nodes: [...folders.map(folderToDto), ...files.map((f) => fileToDto(f))],
      hasAnyHistory,
    });
  } catch (err) {
    console.error("Failed to load workspace tree:", err);
    return serverError("Failed to load workspace tree.");
  }
}
