import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import { fetchJson } from "@/lib/api/fetchJson";
import type { WorkspaceNode } from "@/types/file";
import type { NodeMap } from "@/lib/utils/treeUtils";

interface DriveImportResult {
  filesImported: number;
  foldersImported: number;
  skipped: number;
}

function toNodeMap(nodes: WorkspaceNode[]): NodeMap {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

async function runDriveImport(): Promise<DriveImportResult> {
  // Walks the whole Drive folder and can pull down many files, so this gets a much longer
  // ceiling than a normal request — but still a ceiling, so a stalled call can't hang forever.
  const result = await fetchJson<DriveImportResult>("/api/sync/import-from-drive", {
    method: "POST",
    action: "Drive sync",
    timeoutMs: 120000,
  });

  if (result.filesImported > 0 || result.foldersImported > 0) {
    const { nodes } = await cloudRepo.fetchWorkspaceTree();
    useWorkspaceStore.getState().replaceAll(toNodeMap(nodes));
  }

  return result;
}

/** Pulls in anything sitting in the user's "NextNotePad.com" Drive folder that the app doesn't
 *  already know about (added directly in Drive, from another device, or from before this
 *  integration existed) — the read counterpart to the automatic push-on-edit sync. Manual,
 *  user-facing version: always reports the outcome, including "nothing to do." */
export async function syncFromDrive(): Promise<void> {
  try {
    const result = await runDriveImport();

    const total = result.filesImported + result.foldersImported;
    if (total === 0) {
      toast.success(
        result.skipped > 0
          ? `Nothing new to import (skipped ${result.skipped} unsupported item${result.skipped === 1 ? "" : "s"}).`
          : "Nothing new to import — already up to date with Drive.",
      );
      return;
    }

    const parts = [
      result.filesImported > 0 ? `${result.filesImported} file${result.filesImported === 1 ? "" : "s"}` : null,
      result.foldersImported > 0 ? `${result.foldersImported} folder${result.foldersImported === 1 ? "" : "s"}` : null,
    ].filter(Boolean);
    toast.success(`Imported ${parts.join(" and ")} from Drive.`);
  } catch {
    toast.error("Couldn't sync from Drive — check your connection and try again.");
  }
}

/** Same import, run quietly in the background right after signing in (any device/browser) —
 *  called fire-and-forget from auth bootstrap so it never delays the initial workspace load.
 *  Only speaks up when it actually finds something new; a transient failure here just logs,
 *  since the user never asked for this one and an error toast on every login would be noise
 *  (the manual "Sync from Drive" button remains available for a deliberate retry). */
export async function autoSyncFromDriveOnLogin(): Promise<void> {
  try {
    const result = await runDriveImport();
    const total = result.filesImported + result.foldersImported;
    if (total > 0) {
      const parts = [
        result.filesImported > 0 ? `${result.filesImported} file${result.filesImported === 1 ? "" : "s"}` : null,
        result.foldersImported > 0 ? `${result.foldersImported} folder${result.foldersImported === 1 ? "" : "s"}` : null,
      ].filter(Boolean);
      toast.success(`Found ${parts.join(" and ")} in Drive — added to your workspace.`);
    }
  } catch (err) {
    console.error("Background Drive sync failed:", err);
  }
}
