import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./jwt";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  return prisma.user.findUnique({ where: { id: payload.userId } });
}

/** Most routes just need the caller's workspace id — resolves both in one place. */
export async function getSessionUserWithWorkspace() {
  const user = await getSessionUser();
  if (!user) return null;

  const workspace = await prisma.workspace.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return { user, workspaceId: workspace.id };
}
