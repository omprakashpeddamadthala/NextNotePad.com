import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { unauthorized, badRequest, serverError } from "@/lib/api/respond";
import { createWorkspaceSchema } from "@/lib/validation/workspaceSchemas";
import { getDriveClientForUser } from "@/lib/drive/driveClient";
import { ensureWorkspaceFolder } from "@/lib/drive/workspaceFolder";

/** GET /api/workspaces — list all workspaces for the authenticated user. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const workspaces = await prisma.workspace.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      driveWorkspaceFolderId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const activeWorkspaceId = user.activeWorkspaceId ?? workspaces[0]?.id ?? null;

  return NextResponse.json({ workspaces, activeWorkspaceId });
}

/** POST /api/workspaces — create a new workspace and its Google Drive folder. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const parsed = createWorkspaceSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);

  const { name, description } = parsed.data;

  // Check for duplicate name within this user's workspaces
  const existing = await prisma.workspace.findFirst({
    where: { userId: user.id, name: { equals: name } },
  });
  if (existing) {
    return NextResponse.json({ error: `A workspace named "${name}" already exists.` }, { status: 409 });
  }

  try {
    // Create the DB record first so we have an ID for the Drive folder creation
    const workspace = await prisma.workspace.create({
      data: { userId: user.id, name, description: description ?? null },
    });

    // Set as active workspace immediately
    await prisma.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: workspace.id },
    });

    // Attempt to create the Google Drive workspace folder (best-effort — don't fail the whole
    // workspace creation if Drive is unavailable or the user hasn't connected Drive)
    let driveWorkspaceFolderId: string | null = null;
    if (user.googleAccessToken || user.googleRefreshToken) {
      try {
        const drive = getDriveClientForUser(user);
        driveWorkspaceFolderId = await ensureWorkspaceFolder(drive, workspace.id);
      } catch (driveErr) {
        console.error(`Failed to create Drive folder for workspace ${workspace.id}:`, driveErr);
        // Don't fail — the workspace is still usable without Drive
      }
    }

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      driveWorkspaceFolderId,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    });
  } catch (err) {
    console.error("Failed to create workspace:", err);
    return serverError("Failed to create workspace. Please try again.");
  }
}
