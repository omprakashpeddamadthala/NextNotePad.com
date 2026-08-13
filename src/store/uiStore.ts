import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandLocalStorage } from "@/services/storage/localStorageService";

type BottomPanelTab = "search" | "console";

interface UIState {
  sidebarVisible: boolean;
  /** Mobile's slide-over explorer sheet — deliberately separate from `sidebarVisible` (which
   *  drives the desktop inline panel and persists) so a persisted "open" from desktop doesn't
   *  make the sheet cover the whole screen the moment a phone loads the app. Always starts
   *  closed. */
  mobileSidebarOpen: boolean;
  /** Mobile's bottom-sheet stand-in for the desktop MenuBar + Toolbar. Also transient. */
  mobileMenuSheetOpen: boolean;
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
  /** Diff Checker — the one Tools-menu utility that still needs a dialog surface (comparing two
   *  tabs needs two panes at once). Everything else (Base64, URL, case) transforms the active
   *  tab's content in place instead of opening a dialog. */
  toolsDialogOpen: boolean;
}

interface UIActions {
  setSidebarVisible: (visible: boolean) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileMenuSheetOpen: (open: boolean) => void;
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
  setToolsDialogOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarVisible: true,
      mobileSidebarOpen: false,
      mobileMenuSheetOpen: false,
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
      toolsDialogOpen: false,

      setSidebarVisible: (sidebarVisible) => set({ sidebarVisible }),
      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setMobileMenuSheetOpen: (mobileMenuSheetOpen) => set({ mobileMenuSheetOpen }),
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
      setToolsDialogOpen: (toolsDialogOpen) => set({ toolsDialogOpen }),
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
