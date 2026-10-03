import { NextRequest, NextResponse } from "next/server";
import { getDriveSession, driveErrorResponse } from "@/lib/drive/session";
import { AppConfigService } from "@/lib/drive/appConfigService";
import {
  createWorkspaceFolder,
  listWorkspaceEntries,
  listWorkspaces,
  setActiveWorkspace,
  workspaceToDto,
} from "@/lib/drive/workspaceService";
import { unauthorized, badRequest } from "@/lib/api/respond";
import { createWorkspaceSchema } from "@/lib/validation/workspaceSchemas";

/** GET /api/workspaces — the user's workspace folders in Drive, plus the active one from
 *  `.appConfig.json` (repaired if it points at a workspace that no longer exists). */
export async function GET() {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const { ds } = session;
    const [workspaces, config] = await Promise.all([
      listWorkspaces(ds),
      new AppConfigService(ds).load(),
    ]);
    let activeWorkspaceId = config.activeWorkspaceId;
    if (
      !activeWorkspaceId ||
      !workspaces.some((w) => w.id === activeWorkspaceId)
    ) {
      activeWorkspaceId = workspaces[0].id;
      await setActiveWorkspace(ds, activeWorkspaceId);
    }
    return NextResponse.json({
      workspaces: workspaces.map(workspaceToDto),
      activeWorkspaceId,
    });
  } catch (err) {
    return driveErrorResponse(err, "Load workspaces");
  }
}

/** POST /api/workspaces — create a workspace folder (+ `.workspace.json`) and make it active. */
export async function POST(request: NextRequest) {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const parsed = createWorkspaceSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { name, description } = parsed.data;
    const { ds } = session;

    const existing = await listWorkspaceEntries(ds);
    if (existing.some((w) => w.name === name)) {
      return NextResponse.json(
        { error: `A workspace named "${name}" already exists.` },
        { status: 409 },
      );
    }
    const folder = await createWorkspaceFolder(ds, name, description);
    await setActiveWorkspace(ds, folder.id);
    return NextResponse.json(workspaceToDto(folder));
  } catch (err) {
    return driveErrorResponse(err, "Create workspace");
  }
}
