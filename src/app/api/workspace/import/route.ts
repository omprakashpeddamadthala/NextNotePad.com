import { NextRequest, NextResponse } from "next/server";
import {
  getDriveSessionWithWorkspace,
  driveErrorResponse,
} from "@/lib/drive/session";
import {
  AppError,
  createNode,
  GUEST_IMPORT_ID_PROPERTY,
  updateNode,
} from "@/lib/drive/workspaceService";
import { importWorkspaceSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest } from "@/lib/api/respond";

const CONCURRENCY = 6;

/**
 * One-time bulk import of a guest workspace into the user's active Drive workspace. Processed
 * level by level (parents before children); siblings within a level are created concurrently
 * with a small cap to stay under Drive's per-user rate limits. Client ids are remapped to Drive ids.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getDriveSessionWithWorkspace();
    if (!session) return unauthorized();
    const parsed = importWorkspaceSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { ds, workspaceId } = session;

    const idMap = new Map<string, string>();
    let pending = [...parsed.data.nodes];
    while (pending.length > 0) {
      const ready = pending.filter(
        (n) => n.parentId === null || idMap.has(n.parentId),
      );
      if (ready.length === 0) break;
      pending = pending.filter((n) => !ready.includes(n));
      for (let i = 0; i < ready.length; i += CONCURRENCY) {
        await Promise.all(
          ready.slice(i, i + CONCURRENCY).map(async (node) => {
            const parentId = node.parentId
              ? idMap.get(node.parentId)!
              : workspaceId;
            const existing = await ds.findChildByAppProperty(
              parentId,
              GUEST_IMPORT_ID_PROPERTY,
              node.id,
              { folder: node.type === "folder" },
            );
            const entry = existing
              ? await updateNode(
                  ds,
                  workspaceId,
                  existing.id,
                  node.type === "file"
                    ? {
                        name: node.name,
                        content: node.content,
                        language: node.language,
                        encoding: node.encoding,
                      }
                    : { name: node.name },
                  node.type,
                )
              : await createNode(ds, workspaceId, {
                  type: node.type,
                  parentId: node.parentId ? idMap.get(node.parentId)! : null,
                  name: node.name,
                  content: node.content,
                  language: node.language,
                  encoding: node.encoding,
                  importId: node.id,
                });
            if (node.type === "file" && node.locked) {
              await ds.update(entry.id, {
                appProperties: {
                  nnp_locked: "1",
                  nnp_salt: node.encryptionSalt ?? null,
                  nnp_iv: node.encryptionIv ?? null,
                },
              });
            }
            idMap.set(node.id, entry.id);
          }),
        );
      }
    }
    if (pending.length > 0) {
      throw new AppError("Import contains missing or cyclic parents.", 400);
    }

    return NextResponse.json({
      idMap: Object.fromEntries(idMap),
      imported: idMap.size,
      skipped: 0,
    });
  } catch (err) {
    return driveErrorResponse(err, "Import workspace");
  }
}
