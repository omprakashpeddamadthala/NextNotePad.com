import { NextRequest, NextResponse } from "next/server";
import {
  driveErrorResponse,
  getDriveSessionForRequest,
} from "@/lib/drive/session";
import { createNode, nodeDto } from "@/lib/drive/workspaceService";
import { createFolderSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized } from "@/lib/api/respond";
import { parseJsonBody } from "@/lib/api/requestBody";

export async function POST(request: NextRequest) {
  try {
    const session = await getDriveSessionForRequest(request);
    if (!session) return unauthorized();
    const parsed = await parseJsonBody(request, createFolderSchema);
    if (!parsed.success) return parsed.response;
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
