import { NextRequest, NextResponse } from "next/server";
import {
  getDriveSessionWithWorkspace,
  driveErrorResponse,
} from "@/lib/drive/session";
import { createNode, nodeDto } from "@/lib/drive/workspaceService";
import { createFolderSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest } from "@/lib/api/respond";

export async function POST(request: NextRequest) {
  try {
    const session = await getDriveSessionWithWorkspace();
    if (!session) return unauthorized();
    const parsed = createFolderSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { ds, workspaceId } = session;
    const entry = await createNode(ds, workspaceId, {
      type: "folder",
      ...parsed.data,
    });
    return NextResponse.json(await nodeDto(ds, entry, workspaceId));
  } catch (err) {
    return driveErrorResponse(err, "Create folder");
  }
}
