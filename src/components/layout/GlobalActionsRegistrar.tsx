"use client";

import { useRef } from "react";
import { useRegisterAction } from "@/hooks/useRegisterAction";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTabsStore } from "@/store/tabsStore";
import { useCreateAndRename } from "@/hooks/useCreateAndRename";
import { useNewNodeTargetParentId } from "@/hooks/useNewNodeTargetParentId";
import { importNativeFiles } from "@/services/fileOperations";

/** Headless component: wires the app-level (non-Monaco) actions into the shared action registry. */
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
  useRegisterAction("search.quickOpen", () => useUIStore.getState().setQuickOpenOpen(true), []);
  useRegisterAction("view.commandPalette", () => useUIStore.getState().setCommandPaletteOpen(true), []);

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
