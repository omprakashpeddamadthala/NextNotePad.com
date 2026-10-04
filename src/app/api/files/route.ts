import { NextRequest, NextResponse } from "next/server";
import {
  driveErrorResponse,
  getDriveSession,
  getDriveSessionForRequest,
} from "@/lib/drive/session";
import {
  createNode,
  listAllFiles,
  nodeDto,
} from "@/lib/drive/workspaceService";
import { createFileSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest } from "@/lib/api/respond";

const MAX_RESULTS = 2000;

export async function GET(request: NextRequest) {
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const query =
      new URL(request.url).searchParams.get("q")?.trim().toLowerCase() || "";
    const files = await listAllFiles(session.ds);
    const filtered = query
      ? files.filter((f) => f.name.toLowerCase().includes(query))
      : files;
    return NextResponse.json({ files: filtered.slice(0, MAX_RESULTS) });
  } catch (err) {
    return driveErrorResponse(err, "Search files");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDriveSessionForRequest(request);
    if (!session) return unauthorized();
    const parsed = createFileSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error);
    const { ds, workspaceId } = session;
    const entry = await createNode(ds, workspaceId, {
      type: "file",
      ...parsed.data,
    });
    return NextResponse.json({
      ...(await nodeDto(ds, entry, workspaceId)),
      content: parsed.data.content,
    });
  } catch (err) {
    return driveErrorResponse(err, "Create file");
  }
}
