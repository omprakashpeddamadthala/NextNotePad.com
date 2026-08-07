import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getSessionUserWithWorkspace } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { importWorkspaceSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest } from "@/lib/api/respond";
import { pushFolderCreate, pushFileCreate } from "@/lib/drive/pushSync";

/**
 * One-time bulk import used right after first login to migrate a guest workspace into
 * the user's cloud one. Client ids are remapped to server ids; processed in dependency
 * order (parent before child) via repeated passes — fine for typical guest-workspace sizes.
 */
export async function POST(request: NextRequest) {
  const session = await getSessionUserWithWorkspace();
  if (!session) return unauthorized();

  const parsed = importWorkspaceSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);

  const pending = [...parsed.data.nodes];
  const idMap = new Map<string, string>();
  const pathMap = new Map<string, string>();
  const createdOrder: { type: "file" | "folder"; id: string }[] = [];

  let progress = true;
  while (pending.length > 0 && progress) {
    progress = false;
    for (let i = pending.length - 1; i >= 0; i--) {
      const node = pending[i];
      const parentResolved = node.parentId === null || idMap.has(node.parentId);
      if (!parentResolved) continue;

      const parentDbId = node.parentId ? (idMap.get(node.parentId) ?? null) : null;
      const parentPath = node.parentId ? (pathMap.get(node.parentId) ?? "") : "";
      const path = `${parentPath}/${node.name}`;

      if (node.type === "folder") {
        const created = await prisma.folder.create({
          data: { workspaceId: session.workspaceId, parentId: parentDbId, name: node.name, path },
        });
        idMap.set(node.id, created.id);
        createdOrder.push({ type: "folder", id: created.id });
      } else {
        const content = node.content ?? "";
        const created = await prisma.file.create({
          data: {
            workspaceId: session.workspaceId,
            parentId: parentDbId,
            name: node.name,
            path,
            language: node.language ?? "plaintext",
            encoding: node.encoding ?? "UTF-8",
            content,
            size: content.length,
          },
        });
        idMap.set(node.id, created.id);
        createdOrder.push({ type: "file", id: created.id });
      }
      pathMap.set(node.id, path);
      pending.splice(i, 1);
      progress = true;
    }
  }

  after(async () => {
    // Sequential, in creation order — each parent folder's Drive id must exist before its children push.
    for (const item of createdOrder) {
      if (item.type === "folder") await pushFolderCreate(item.id);
      else await pushFileCreate(item.id);
    }
  });

  return NextResponse.json({
    idMap: Object.fromEntries(idMap),
    imported: idMap.size,
    skipped: pending.length,
  });
}
