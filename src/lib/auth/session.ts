import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./jwt";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  // Re-checked on every call (this isn't cached anywhere), so a block takes effect on the
  // blocked user's very next request — no re-login or token expiry needed.
  if (!user || user.blocked) return null;

  return user;
}

/**
 * Resolves the user's active workspace, creating a default "My Workspace" if needed.
 * For multi-workspace support: the active workspace is stored on User.activeWorkspaceId.
 * Falls back gracefully: first workspace found for the user, or creates one.
 */
export async function getSessionUserWithWorkspace() {
  const user = await getSessionUser();
  if (!user) return null;

  // Try to load the user's currently-active workspace
  let workspace = user.activeWorkspaceId
    ? await prisma.workspace.findUnique({ where: { id: user.activeWorkspaceId, userId: user.id } })
    : null;

  // If no active workspace, try to find any existing workspace for this user
  if (!workspace) {
    workspace = await prisma.workspace.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
  }

  // If still no workspace, create the default "My Workspace"
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { userId: user.id, name: "My Workspace" },
    });
  }

  // Keep User.activeWorkspaceId in sync (handles first-ever login, or stale pointer)
  if (user.activeWorkspaceId !== workspace.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: workspace.id },
    });
  }

  return { user, workspaceId: workspace.id };
}
