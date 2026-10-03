import { NextRequest, NextResponse } from "next/server";
import { getDriveSession, driveErrorResponse } from "@/lib/drive/session";
import { AppConfigService } from "@/lib/drive/appConfigService";
import {
  getWorkspace,
  listWorkspaceEntries,
  renameWorkspace,
  setActiveWorkspace,
  withWorkspaceMutationLock,
  workspaceToDto,
} from "@/lib/drive/workspaceService";
import { unauthorized, badRequest } from "@/lib/api/respond";
import { updateWorkspaceSchema } from "@/lib/validation/workspaceSchemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const { id } = await params;
    return NextResponse.json(
      workspaceToDto(await getWorkspace(session.ds, id)),
    );
  } catch (err) {
    return driveErrorResponse(err, "Load workspace");
  }
}

/** PATCH /api/workspaces/[id] — renames the Drive folder itself and rewrites `.workspace.json`. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const { id } = await params;
    const parsed = updateWorkspaceSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    return await withWorkspaceMutationLock(session.user.id, async () =>
      NextResponse.json(
        workspaceToDto(await renameWorkspace(session.ds, id, parsed.data)),
      ),
    );
  } catch (err) {
    return driveErrorResponse(err, "Rename workspace");
  }
}

/** DELETE /api/workspaces/[id] — moves the workspace folder (and everything in it) to Drive's trash. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const { id } = await params;
    const { ds, user } = session;
    return await withWorkspaceMutationLock(user.id, async () => {
      await getWorkspace(ds, id);
      const all = await listWorkspaceEntries(ds);
      if (all.length <= 1) {
        return NextResponse.json(
          { error: "Cannot delete your only workspace." },
          { status: 400 },
        );
      }
      const config = await new AppConfigService(ds).load({ fresh: true });
      if (config.activeWorkspaceId === id) {
        await setActiveWorkspace(ds, all.find((w) => w.id !== id)!.id);
      }
      await ds.trash(id);
      return NextResponse.json({ success: true });
    });
  } catch (err) {
    return driveErrorResponse(err, "Delete workspace");
  }
}
