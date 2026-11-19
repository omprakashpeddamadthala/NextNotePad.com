import { NextResponse } from "next/server";
import { driveErrorResponse, getDriveSession } from "@/lib/drive/session";
import { listNoteRevisions } from "@/lib/drive/revisionService";
import { unauthorized } from "@/lib/api/respond";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Earlier versions of a note that Google Drive kept, newest first. */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  console.log(`[revisions] list start file=${id}`);
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const revisions = await listNoteRevisions(session.ds, id);
    console.log(`[revisions] list done file=${id} count=${revisions.length}`);
    return NextResponse.json({ revisions });
  } catch (err) {
    return driveErrorResponse(err, "List versions");
  }
}
