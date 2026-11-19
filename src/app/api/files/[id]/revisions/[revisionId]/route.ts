import { NextResponse } from "next/server";
import { driveErrorResponse, getDriveSession } from "@/lib/drive/session";
import { readNoteRevision } from "@/lib/drive/revisionService";
import { unauthorized } from "@/lib/api/respond";

interface RouteParams {
  params: Promise<{ id: string; revisionId: string }>;
}

/** The text of one earlier version of a note. */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id, revisionId } = await params;
  console.log(`[revisions] read start file=${id} revision=${revisionId}`);
  try {
    const session = await getDriveSession();
    if (!session) return unauthorized();
    const content = await readNoteRevision(session.ds, id, revisionId);
    console.log(`[revisions] read done file=${id} chars=${content.length}`);
    return NextResponse.json({ content });
  } catch (err) {
    return driveErrorResponse(err, "Read version");
  }
}
