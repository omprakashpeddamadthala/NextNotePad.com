import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
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

/** Pulls in anything sitting in the user's "NextNotePad.com" Drive folder that the app doesn't
 *  already know about (added directly in Drive, or from before this integration existed) — the
 *  read counterpart to the automatic push-on-edit sync. On-demand only: there's no way to know a
 *  Drive-side change happened without either polling or a push channel, so this is a manual
 *  "Sync from Drive" action rather than something that runs automatically. */
export async function syncFromDrive(): Promise<void> {
  try {
    const res = await fetch("/api/sync/import-from-drive", { method: "POST" });
    if (!res.ok) throw new Error(`Import failed (${res.status})`);
    const result: DriveImportResult = await res.json();

    if (result.filesImported > 0 || result.foldersImported > 0) {
      const { nodes } = await cloudRepo.fetchWorkspaceTree();
      useWorkspaceStore.getState().replaceAll(toNodeMap(nodes));
    }

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
