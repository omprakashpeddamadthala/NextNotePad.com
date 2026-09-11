import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { unauthorized, serverError } from "@/lib/api/respond";
import { syncWorkspacesFromDrive } from "@/lib/drive/syncWorkspacesFromDrive";

/**
 * POST /api/sync/workspaces-from-drive
 * Explicitly triggers a scan of the user's Google Drive root folder ("NextNotePad.com")
 * and creates DB workspace records for any top-level subfolders found.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    const result = await syncWorkspacesFromDrive(user.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error syncing workspaces from Drive:", err);
    return serverError("Failed to sync workspaces from Drive.");
  }
}
