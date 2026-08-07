import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandLocalStorage } from "@/services/storage/localStorageService";

type BottomPanelTab = "search" | "console";

interface UIState {
  sidebarVisible: boolean;
  bottomPanelVisible: boolean;
  activeBottomTab: BottomPanelTab;
  commandPaletteOpen: boolean;
  quickOpenOpen: boolean;
  settingsDialogOpen: boolean;
  aboutDialogOpen: boolean;
  exportImportDialogOpen: boolean;
  workspaceStatsOpen: boolean;
  isSplitView: boolean;
  markdownPreviewVisible: boolean;
}

interface UIActions {
  setSidebarVisible: (visible: boolean) => void;
  toggleSidebar: () => void;
  setBottomPanelVisible: (visible: boolean) => void;
  setActiveBottomTab: (tab: BottomPanelTab) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickOpenOpen: (open: boolean) => void;
  setSettingsDialogOpen: (open: boolean) => void;
  setAboutDialogOpen: (open: boolean) => void;
  setExportImportDialogOpen: (open: boolean) => void;
  setWorkspaceStatsOpen: (open: boolean) => void;
  setSplitView: (isSplit: boolean) => void;
  toggleMarkdownPreview: () => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarVisible: true,
      bottomPanelVisible: false,
      activeBottomTab: "search",
      commandPaletteOpen: false,
      quickOpenOpen: false,
      settingsDialogOpen: false,
      aboutDialogOpen: false,
      exportImportDialogOpen: false,
      workspaceStatsOpen: false,
      isSplitView: false,
      markdownPreviewVisible: false,

      setSidebarVisible: (sidebarVisible) => set({ sidebarVisible }),
      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
      setBottomPanelVisible: (bottomPanelVisible) => set({ bottomPanelVisible }),
      setActiveBottomTab: (activeBottomTab) => set({ activeBottomTab }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setQuickOpenOpen: (quickOpenOpen) => set({ quickOpenOpen }),
      setSettingsDialogOpen: (settingsDialogOpen) => set({ settingsDialogOpen }),
      setAboutDialogOpen: (aboutDialogOpen) => set({ aboutDialogOpen }),
      setExportImportDialogOpen: (exportImportDialogOpen) => set({ exportImportDialogOpen }),
      setWorkspaceStatsOpen: (workspaceStatsOpen) => set({ workspaceStatsOpen }),
      setSplitView: (isSplitView) => set({ isSplitView }),
      toggleMarkdownPreview: () => set((state) => ({ markdownPreviewVisible: !state.markdownPreviewVisible })),
    }),
    {
      name: "np-ui",
      storage: createJSONStorage(() => zustandLocalStorage),
      partialize: (state) => ({
        sidebarVisible: state.sidebarVisible,
        bottomPanelVisible: state.bottomPanelVisible,
      }),
    },
  ),
);
