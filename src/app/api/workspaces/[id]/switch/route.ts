import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { unauthorized, notFound, serverError } from "@/lib/api/respond";

/**
 * POST /api/workspaces/[id]/switch
 * Sets the given workspace as the user's active workspace.
 * Responds with the workspace record so the client can update its state in one request.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;

  // Verify the workspace belongs to this user
  const workspace = await prisma.workspace.findUnique({ where: { id, userId: user.id } });
  if (!workspace) return notFound("Workspace not found.");

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: id },
    });

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      driveWorkspaceFolderId: workspace.driveWorkspaceFolderId,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    });
  } catch (err) {
    console.error("Failed to switch workspace:", err);
    return serverError("Failed to switch workspace.");
  }
}
