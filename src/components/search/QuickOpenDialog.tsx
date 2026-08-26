"use client";

import { useMemo } from "react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { getFileIcon } from "@/lib/fileIcons";
import { useDialogStore } from "@/store/dialogStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useTabsStore } from "@/store/tabsStore";
import type { FileNode } from "@/types/file";

export function QuickOpenDialog() {
  const open = useDialogStore((s) => s.open.quickOpen);
  const setDialogOpen = useDialogStore((s) => s.setDialogOpen);
  const setOpen = (v: boolean) => setDialogOpen("quickOpen", v);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const recent = useRecentFilesStore((s) => s.recent);
  const addRecent = useRecentFilesStore((s) => s.addRecent);
  const openTab = useTabsStore((s) => s.openTab);

  const files = useMemo(() => {
    const all = Object.values(nodes).filter((n): n is FileNode => n.type === "file" && !n.deleted);
    const recentOrder = new Map(recent.map((r, i) => [r.fileId, i]));
    return all.sort((a, b) => {
      const ra = recentOrder.get(a.id) ?? Infinity;
      const rb = recentOrder.get(b.id) ?? Infinity;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [nodes, recent]);

  function handleSelect(fileId: string) {
    openTab(fileId);
    addRecent(fileId);
    setOpen(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Quick Open" description="Jump to a file by name">
      <CommandInput placeholder="Go to file…" />
      <CommandList>
        <CommandEmpty>No files found.</CommandEmpty>
        <CommandGroup heading="Files">
          {files.map((file) => {
            const Icon = getFileIcon(file.name);
            return (
              <CommandItem key={file.id} value={`${file.name} ${file.path}`} onSelect={() => handleSelect(file.id)}>
                <Icon className="size-4 shrink-0" />
                <span>{file.name}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">{file.path}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
