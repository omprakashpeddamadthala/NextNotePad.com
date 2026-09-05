import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { unauthorized, notFound, badRequest, serverError } from "@/lib/api/respond";
import { updateWorkspaceSchema } from "@/lib/validation/workspaceSchemas";

/** GET /api/workspaces/[id] — get a single workspace. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const workspace = await prisma.workspace.findUnique({ where: { id, userId: user.id } });
  if (!workspace) return notFound("Workspace not found.");

  return NextResponse.json({
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    driveWorkspaceFolderId: workspace.driveWorkspaceFolderId,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  });
}

/** PATCH /api/workspaces/[id] — rename or update workspace. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const workspace = await prisma.workspace.findUnique({ where: { id, userId: user.id } });
  if (!workspace) return notFound("Workspace not found.");

  const parsed = updateWorkspaceSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);

  const { name, description } = parsed.data;

  // Check for duplicate name (excluding self)
  if (name && name !== workspace.name) {
    const duplicate = await prisma.workspace.findFirst({
      where: { userId: user.id, name: { equals: name }, id: { not: id } },
    });
    if (duplicate) {
      return NextResponse.json({ error: `A workspace named "${name}" already exists.` }, { status: 409 });
    }
  }

  try {
    const updated = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      driveWorkspaceFolderId: updated.driveWorkspaceFolderId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error("Failed to update workspace:", err);
    return serverError("Failed to update workspace.");
  }
}

/** DELETE /api/workspaces/[id] — delete a workspace (and its files). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const workspace = await prisma.workspace.findUnique({ where: { id, userId: user.id } });
  if (!workspace) return notFound("Workspace not found.");

  // Refuse to delete the user's only workspace
  const count = await prisma.workspace.count({ where: { userId: user.id } });
  if (count <= 1) {
    return NextResponse.json({ error: "Cannot delete your only workspace." }, { status: 400 });
  }

  try {
    // If this was the active workspace, switch to another before deleting
    if (user.activeWorkspaceId === id) {
      const another = await prisma.workspace.findFirst({
        where: { userId: user.id, id: { not: id } },
        orderBy: { createdAt: "asc" },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { activeWorkspaceId: another?.id ?? null },
      });
    }

    await prisma.workspace.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete workspace:", err);
    return serverError("Failed to delete workspace.");
  }
}
