import { NextResponse } from "next/server";
import { getSessionUserWithWorkspace } from "@/lib/auth/session";
import { importFromDrive } from "@/lib/drive/pullSync";
import { unauthorized } from "@/lib/api/respond";

export async function POST() {
  const session = await getSessionUserWithWorkspace();
  if (!session) return unauthorized();

  const result = await importFromDrive(session.workspaceId);
  return NextResponse.json(result);
}
