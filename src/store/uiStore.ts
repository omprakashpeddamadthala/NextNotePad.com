import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandLocalStorage } from "@/services/storage/localStorageService";

type BottomPanelTab = "search" | "console";
export type TreeViewLayout = "full" | "side";

interface UIState {
  sidebarVisible: boolean;
  mobileSidebarOpen: boolean;
  mobileMenuSheetOpen: boolean;
  mobileWorkspaceSheetOpen: boolean;
  mobileReadMode: boolean;
  /** Hides everything but the text. Not saved between visits. */
  focusMode: boolean;
  /** Tree view for JSON, XML and YAML notes. Remembered between visits. */
  treeViewVisible: boolean;
  /** "full" covers the text in the same tab; "side" shows the tree beside the text. */
  treeViewLayout: TreeViewLayout;
  explorerShowTrash: boolean;
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
  setMobileWorkspaceSheetOpen: (open: boolean) => void;
  toggleMobileReadMode: () => void;
  toggleFocusMode: () => void;
  setFocusMode: (focusMode: boolean) => void;
  toggleTreeView: () => void;
  setTreeViewVisible: (visible: boolean) => void;
  /** Opens the tree in this layout, or closes it if it is already open that way. */
  toggleTreeViewLayout: (layout: TreeViewLayout) => void;
  setExplorerShowTrash: (show: boolean) => void;
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
      mobileWorkspaceSheetOpen: false,
      mobileReadMode: false,
      focusMode: false,
      treeViewVisible: false,
      treeViewLayout: "full",
      explorerShowTrash: false,
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
      setMobileWorkspaceSheetOpen: (mobileWorkspaceSheetOpen) => set({ mobileWorkspaceSheetOpen }),
      toggleMobileReadMode: () => set((state) => ({ mobileReadMode: !state.mobileReadMode })),
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      setFocusMode: (focusMode) => set({ focusMode }),
      toggleTreeView: () => set((state) => ({ treeViewVisible: !state.treeViewVisible })),
      setTreeViewVisible: (treeViewVisible) => set({ treeViewVisible }),
      toggleTreeViewLayout: (layout) =>
        set((state) => ({
          treeViewVisible: !(state.treeViewVisible && state.treeViewLayout === layout),
          treeViewLayout: layout,
        })),
      setExplorerShowTrash: (explorerShowTrash) => set({ explorerShowTrash }),
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
        mobileReadMode: state.mobileReadMode,
        treeViewVisible: state.treeViewVisible,
        treeViewLayout: state.treeViewLayout,
      }),
    },
  ),
);
