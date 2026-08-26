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
  isSplitView: boolean;
  markdownPreviewVisible: boolean;
  /** Explorer's "Show Hidden Items" toggle — hidden files/folders stay out of the tree until this
   *  is on, same idea as a Finder/Explorer dotfile toggle. */
  showHiddenFiles: boolean;
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
    }),
    {
      name: "np-ui",
      storage: createJSONStorage(() => zustandLocalStorage),
      partialize: (state) => ({
        sidebarVisible: state.sidebarVisible,
        bottomPanelVisible: state.bottomPanelVisible,
        showHiddenFiles: state.showHiddenFiles,
      }),
    },
  ),
);
