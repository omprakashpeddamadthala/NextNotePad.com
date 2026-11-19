"use client";

import { useRef } from "react";
import { useRegisterAction } from "@/hooks/useRegisterAction";
import { useUIStore } from "@/store/uiStore";
import { useDialogStore } from "@/store/dialogStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTabsStore } from "@/store/tabsStore";
import { useCreateAndRename } from "@/hooks/useCreateAndRename";
import { useNewNodeTargetParentId } from "@/hooks/useNewNodeTargetParentId";
import { importNativeFiles } from "@/services/fileOperations";
import { openDiffCheckerForActiveTab } from "@/services/diffChecker";
import { downloadNote } from "@/services/noteExport/downloadNote";
import { printNote } from "@/services/noteExport/printNote";
import { useVersionHistoryStore } from "@/store/versionHistoryStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { treeFormatFor } from "@/services/treeView/parseNote";
import { toast } from "sonner";

function activeFileId(): string | null {
  const { tabs, activeTabId } = useTabsStore.getState();
  return tabs.find((t) => t.id === activeTabId)?.fileId ?? null;
}

export function GlobalActionsRegistrar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createFileAndRename, createFolderAndRename } = useCreateAndRename();
  const targetParentId = useNewNodeTargetParentId();

  useRegisterAction("file.new", () => createFileAndRename(targetParentId), [targetParentId]);
  useRegisterAction("file.newFolder", () => createFolderAndRename(targetParentId), [targetParentId]);
  useRegisterAction("file.open", () => fileInputRef.current?.click(), []);

  useRegisterAction(
    "file.closeTab",
    () => {
      const { activeTabId, closeTab } = useTabsStore.getState();
      if (activeTabId) closeTab(activeTabId);
    },
    [],
  );
  useRegisterAction("file.closeAllTabs", () => useTabsStore.getState().closeAll(), []);
  useRegisterAction("tabs.next", () => useTabsStore.getState().nextTab(), []);
  useRegisterAction("tabs.previous", () => useTabsStore.getState().previousTab(), []);
  useRegisterAction(
    "file.download",
    () => {
      const id = activeFileId();
      if (id) void downloadNote(id);
    },
    [],
  );
  useRegisterAction(
    "file.print",
    () => {
      const id = activeFileId();
      if (id) void printNote(id);
    },
    [],
  );
  useRegisterAction(
    "file.versionHistory",
    () => {
      const id = activeFileId();
      if (id) useVersionHistoryStore.getState().openFor(id);
    },
    [],
  );
  useRegisterAction(
    "view.toggleTreeView",
    () => {
      const ui = useUIStore.getState();
      const id = activeFileId();
      const node = id ? useWorkspaceStore.getState().nodes[id] : undefined;
      const supported = node?.type === "file" && treeFormatFor(node.language, node.name);
      if (!supported && !ui.treeViewVisible) {
        toast.info("Tree view works with JSON, XML and YAML notes.");
        return;
      }
      ui.toggleTreeView();
    },
    [],
  );
  useRegisterAction("view.toggleFocusMode", () => useUIStore.getState().toggleFocusMode(), []);

  useRegisterAction("tabs.reopenClosed", () => useTabsStore.getState().reopenClosed(), []);

  useRegisterAction("view.zoomIn", () => useSettingsStore.getState().zoomIn(), []);
  useRegisterAction("view.zoomOut", () => useSettingsStore.getState().zoomOut(), []);
  useRegisterAction("view.resetZoom", () => useSettingsStore.getState().resetZoom(), []);
  useRegisterAction("view.toggleSidebar", () => useUIStore.getState().toggleSidebar(), []);
  useRegisterAction(
    "view.toggleWordWrap",
    () => {
      const { settings, updateSettings } = useSettingsStore.getState();
      updateSettings({ wordWrap: !settings.wordWrap });
    },
    [],
  );
  useRegisterAction(
    "view.toggleMinimap",
    () => {
      const { settings, updateSettings } = useSettingsStore.getState();
      updateSettings({ showMinimap: !settings.showMinimap });
    },
    [],
  );

  useRegisterAction(
    "search.findInFiles",
    () => {
      const ui = useUIStore.getState();
      ui.setActiveBottomTab("search");
      ui.setBottomPanelVisible(true);
    },
    [],
  );
  useRegisterAction("search.quickOpen", () => useDialogStore.getState().openDialog("quickOpen"), []);
  useRegisterAction("view.commandPalette", () => useDialogStore.getState().openDialog("commandPalette"), []);
  useRegisterAction("tools.diffChecker", () => openDiffCheckerForActiveTab(), []);

  return (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      className="hidden"
      aria-hidden
      onChange={(e) => {
        if (e.target.files?.length) void importNativeFiles(e.target.files, targetParentId);
        e.target.value = "";
      }}
    />
  );
}
