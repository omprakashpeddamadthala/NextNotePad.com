"use client";

import {
  FilePlus,
  FolderPlus,
  FolderOpen,
  Save,
  SaveAll,
  X,
  XSquare,
  Download,
  Upload,
  History,
} from "lucide-react";
import { TopMenu } from "./TopMenu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { SHORTCUT_BY_ACTION } from "@/lib/constants/shortcuts";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { useUIStore } from "@/store/uiStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";

export function FileMenu() {
  const setExportImportOpen = useUIStore((s) => s.setExportImportDialogOpen);
  const recent = useRecentFilesStore((s) => s.recent);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const openTab = useTabsStore((s) => s.openTab);

  const recentWithNames = recent
    .map((r) => ({ ...r, node: nodes[r.fileId] }))
    .filter((r) => r.node && !r.node.deleted)
    .slice(0, 10);

  return (
    <TopMenu label="File">
      <DropdownMenuItem onSelect={() => runAction("file.new")}>
        <FilePlus /> New File
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["file.new"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("file.newFolder")}>
        <FolderPlus /> New Folder
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["file.newFolder"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("file.open")}>
        <FolderOpen /> Open / Import File…
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["file.open"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => runAction("file.save")}>
        <Save /> Save
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["file.save"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("file.saveAs")}>
        <SaveAll /> Save As…
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["file.saveAs"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => runAction("file.closeTab")}>
        <X /> Close Tab
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["file.closeTab"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("file.closeAllTabs")}>
        <XSquare /> Close All Tabs
        <DropdownMenuShortcut>{SHORTCUT_BY_ACTION["file.closeAllTabs"].keys}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <History /> Recent Files
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-64">
          {recentWithNames.length === 0 && (
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              No recent files
            </DropdownMenuLabel>
          )}
          {recentWithNames.map((r) => (
            <DropdownMenuItem key={r.fileId} onSelect={() => openTab(r.fileId)}>
              {r.node!.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => setExportImportOpen(true)}>
        <Download /> Export Workspace (.zip)
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setExportImportOpen(true)}>
        <Upload /> Import Workspace…
      </DropdownMenuItem>
    </TopMenu>
  );
}
