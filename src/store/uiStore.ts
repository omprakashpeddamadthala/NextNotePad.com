import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandLocalStorage } from "@/services/storage/localStorageService";

type BottomPanelTab = "search" | "console";

interface UIState {
  sidebarVisible: boolean;
  mobileSidebarOpen: boolean;
  mobileMenuSheetOpen: boolean;
  bottomPanelVisible: boolean;
  activeBottomTab: BottomPanelTab;
  isSplitView: boolean;
  markdownPreviewVisible: boolean;
  showHiddenFiles: boolean;
  toolsRailVisible: boolean;
  markdownEditingFileIds: Record<string, boolean>;
}

interface UIActions {
  setSidebarVisible: (visible: boolean) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileMenuSheetOpen: (open: boolean) => void;
  setBottomPanelVisible: (visible: boolean) => void;
  setActiveBottomTab: (tab: BottomPanelTab) => void;
  setSplitView: (isSplit: boolean) => void;
  toggleMarkdownPreview: () => void;
  toggleShowHiddenFiles: () => void;
  setToolsRailVisible: (visible: boolean) => void;
  toggleToolsRail: () => void;
  setMarkdownEditing: (fileId: string, editing: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarVisible: true,
      mobileSidebarOpen: false,
      mobileMenuSheetOpen: false,
      bottomPanelVisible: false,
      activeBottomTab: "search",
      isSplitView: false,
      markdownPreviewVisible: false,
      showHiddenFiles: false,
      toolsRailVisible: true,
      markdownEditingFileIds: {},

      setSidebarVisible: (sidebarVisible) => set({ sidebarVisible }),
      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setMobileMenuSheetOpen: (mobileMenuSheetOpen) => set({ mobileMenuSheetOpen }),
      setBottomPanelVisible: (bottomPanelVisible) => set({ bottomPanelVisible }),
      setActiveBottomTab: (activeBottomTab) => set({ activeBottomTab }),
      setSplitView: (isSplitView) => set({ isSplitView }),
      toggleMarkdownPreview: () => set((state) => ({ markdownPreviewVisible: !state.markdownPreviewVisible })),
      toggleShowHiddenFiles: () => set((state) => ({ showHiddenFiles: !state.showHiddenFiles })),
      setToolsRailVisible: (toolsRailVisible) => set({ toolsRailVisible }),
      toggleToolsRail: () => set((state) => ({ toolsRailVisible: !state.toolsRailVisible })),
      setMarkdownEditing: (fileId, editing) =>
        set((state) => ({
          markdownEditingFileIds: {
            ...state.markdownEditingFileIds,
            [fileId]: editing,
          },
        })),
    }),
    {
      name: "np-ui",
      storage: createJSONStorage(() => zustandLocalStorage),
      partialize: (state) => ({
        sidebarVisible: state.sidebarVisible,
        bottomPanelVisible: state.bottomPanelVisible,
        showHiddenFiles: state.showHiddenFiles,
        toolsRailVisible: state.toolsRailVisible,
      }),
    },
  ),
);
