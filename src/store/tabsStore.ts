import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Tab, EditorViewState } from "@/types/file";
import { generateId } from "@/lib/id";
import { guestOnlyLocalStorage } from "@/services/storage/localStorageService";

const MAX_CLOSED_STACK = 10;

export interface SplitView {
  leftTabId: string;
  rightTabId: string;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  dirtyTabIds: Record<string, boolean>;
  closedStack: Tab[];
  splitView: SplitView | null;
}

interface TabsActions {
  openTab: (fileId: string, opts?: { pinned?: boolean; readOnly?: boolean }) => string;
  closeTab: (tabId: string) => void;
  closeOthers: (tabId: string) => void;
  closeLeft: (tabId: string) => void;
  closeRight: (tabId: string) => void;
  closeAll: () => void;
  pinTab: (tabId: string, pinned: boolean) => void;
  setReadOnly: (tabId: string, readOnly: boolean) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  setActiveTab: (tabId: string) => void;
  updateViewState: (tabId: string, viewState: EditorViewState) => void;
  setDirty: (tabId: string, dirty: boolean) => void;
  reopenClosed: () => string | null;
  setSplitView: (split: SplitView | null) => void;
  resetSession: () => void;
  remapFileIds: (idMap: Record<string, string>) => void;
  nextTab: () => void;
  previousTab: () => void;
  tabForFile: (fileId: string) => Tab | undefined;
}

export const useTabsStore = create<TabsState & TabsActions>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      dirtyTabIds: {},
      closedStack: [],
      splitView: null,

      tabForFile: (fileId) => get().tabs.find((t) => t.fileId === fileId),

      openTab: (fileId, opts) => {
        const existing = get().tabs.find((t) => t.fileId === fileId);
        if (existing) {
          set({ activeTabId: existing.id });
          return existing.id;
        }
        const tab: Tab = {
          id: generateId(),
          fileId,
          pinned: opts?.pinned ?? false,
          readOnly: opts?.readOnly ?? false,
          viewState: null,
        };
        set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id }));
        return tab.id;
      },

      closeTab: (tabId) => {
        const state = get();
        const index = state.tabs.findIndex((t) => t.id === tabId);
        if (index === -1) return;
        const closedTab = state.tabs[index];
        const remaining = state.tabs.filter((t) => t.id !== tabId);
        const { [tabId]: _removedDirty, ...restDirty } = state.dirtyTabIds;
        void _removedDirty;

        let nextActive = state.activeTabId;
        if (state.activeTabId === tabId) {
          const fallback = remaining[index] ?? remaining[index - 1];
          nextActive = fallback ? fallback.id : null;
        }

        set({
          tabs: remaining,
          activeTabId: nextActive,
          dirtyTabIds: restDirty,
          closedStack: [closedTab, ...state.closedStack].slice(0, MAX_CLOSED_STACK),
          splitView:
            state.splitView &&
            (state.splitView.leftTabId === tabId || state.splitView.rightTabId === tabId)
              ? null
              : state.splitView,
        });
      },

      closeOthers: (tabId) =>
        set((state) => {
          const kept = state.tabs.filter((t) => t.id === tabId || t.pinned);
          return { tabs: kept, activeTabId: tabId };
        }),

      closeLeft: (tabId) =>
        set((state) => {
          const index = state.tabs.findIndex((t) => t.id === tabId);
          if (index === -1) return state;
          const kept = state.tabs.filter((t, i) => i >= index || t.pinned);
          return { tabs: kept };
        }),

      closeRight: (tabId) =>
        set((state) => {
          const index = state.tabs.findIndex((t) => t.id === tabId);
          if (index === -1) return state;
          const kept = state.tabs.filter((t, i) => i <= index || t.pinned);
          return { tabs: kept };
        }),

      closeAll: () =>
        set((state) => {
          const kept = state.tabs.filter((t) => t.pinned);
          return {
            tabs: kept,
            activeTabId: kept[0]?.id ?? null,
            splitView: null,
          };
        }),

      pinTab: (tabId, pinned) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, pinned } : t)),
        })),

      setReadOnly: (tabId, readOnly) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, readOnly } : t)),
        })),

      reorderTabs: (fromIndex, toIndex) =>
        set((state) => {
          const tabs = [...state.tabs];
          const [moved] = tabs.splice(fromIndex, 1);
          if (!moved) return state;
          tabs.splice(toIndex, 0, moved);
          return { tabs };
        }),

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      updateViewState: (tabId, viewState) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, viewState } : t)),
        })),

      setDirty: (tabId, dirty) =>
        set((state) => ({
          dirtyTabIds: { ...state.dirtyTabIds, [tabId]: dirty },
        })),

      reopenClosed: () => {
        const state = get();
        const [tab, ...rest] = state.closedStack;
        if (!tab) return null;
        if (state.tabs.some((t) => t.id === tab.id)) {
          set({ closedStack: rest });
          return null;
        }
        set({ tabs: [...state.tabs, tab], activeTabId: tab.id, closedStack: rest });
        return tab.id;
      },

      setSplitView: (splitView) => set({ splitView }),

      nextTab: () =>
        set((state) => {
          if (state.tabs.length === 0) return state;
          const index = state.tabs.findIndex((t) => t.id === state.activeTabId);
          const nextIndex = (index + 1) % state.tabs.length;
          return { activeTabId: state.tabs[nextIndex].id };
        }),

      previousTab: () =>
        set((state) => {
          if (state.tabs.length === 0) return state;
          const index = state.tabs.findIndex((t) => t.id === state.activeTabId);
          const prevIndex = (index - 1 + state.tabs.length) % state.tabs.length;
          return { activeTabId: state.tabs[prevIndex].id };
        }),

      resetSession: () =>
        set({ tabs: [], activeTabId: null, dirtyTabIds: {}, closedStack: [], splitView: null }),

      /** After migrating guest files to the cloud, swap each open tab's local fileId for its new server id. */
      remapFileIds: (idMap) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (idMap[t.fileId] ? { ...t, fileId: idMap[t.fileId] } : t)),
        })),
    }),
    {
      name: "np-tabs",
      storage: createJSONStorage(() => guestOnlyLocalStorage),
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        splitView: state.splitView,
      }),
    },
  ),
);
