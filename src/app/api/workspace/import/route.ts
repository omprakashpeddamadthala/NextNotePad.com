import { NextRequest, NextResponse } from "next/server";
import {
  driveErrorResponse,
  getDriveSessionForRequest,
} from "@/lib/drive/session";
import { createNode } from "@/lib/drive/workspaceService";
import { importWorkspaceSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest } from "@/lib/api/respond";

const CONCURRENCY = 6;

export async function POST(request: NextRequest) {
  try {
    const session = await getDriveSessionForRequest(request);
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
            const entry = await createNode(ds, workspaceId, {
              type: node.type,
              parentId: node.parentId ? idMap.get(node.parentId)! : null,
              name: node.name,
              content: node.content,
              language: node.language,
              encoding: node.encoding,
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

    return NextResponse.json({
      idMap: Object.fromEntries(idMap),
      imported: idMap.size,
      skipped: pending.length,
    });
  } catch (err) {
    return driveErrorResponse(err, "Import workspace");
  }
}
