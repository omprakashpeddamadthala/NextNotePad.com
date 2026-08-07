"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { exportWorkspaceZip, importWorkspaceZip } from "@/services/exportImport/zipService";

export function ExportImportDialog() {
  const open = useUIStore((s) => s.exportImportDialogOpen);
  const setOpen = useUIStore((s) => s.setExportImportDialogOpen);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const count = await exportWorkspaceZip(nodes);
      toast.success(`Exported ${count} file${count === 1 ? "" : "s"} to a .zip download.`);
    } catch {
      toast.error("Export failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImportFile(file: File) {
    setBusy(true);
    try {
      const { filesImported } = await importWorkspaceZip(file);
      toast.success(`Imported ${filesImported} file${filesImported === 1 ? "" : "s"}.`);
      setOpen(false);
    } catch {
      toast.error("Import failed — is this a valid .zip file?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export / Import Workspace</DialogTitle>
          <DialogDescription>
            Export your entire workspace as a .zip, or import files from one — folder structure is
            preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 border p-3">
            <div>
              <p className="text-sm font-medium">Export Workspace</p>
              <p className="text-xs text-muted-foreground">Download every file as a .zip archive.</p>
            </div>
            <Button size="sm" disabled={busy} onClick={() => void handleExport()}>
              <Download className="size-4" /> Export
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 border p-3">
            <div>
              <p className="text-sm font-medium">Import Workspace</p>
              <p className="text-xs text-muted-foreground">Merge files from a .zip into this workspace.</p>
            </div>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" /> Import…
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImportFile(file);
            e.target.value = "";
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
