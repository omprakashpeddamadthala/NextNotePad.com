import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RecentEntry, SearchHistoryEntry } from "@/types/file";
import { zustandLocalStorage } from "@/services/storage/localStorageService";

const MAX_RECENT = 50;
const MAX_SEARCH_HISTORY = 20;

interface RecentState {
  recent: RecentEntry[];
  favorites: string[];
  searchHistory: SearchHistoryEntry[];
}

interface RecentActions {
  addRecent: (fileId: string) => void;
  removeRecent: (fileId: string) => void;
  clearRecent: () => void;
  toggleFavorite: (fileId: string) => void;
  isFavorite: (fileId: string) => boolean;
  addSearchHistory: (entry: SearchHistoryEntry) => void;
  clearSearchHistory: () => void;
}

export const useRecentFilesStore = create<RecentState & RecentActions>()(
  persist(
    (set, get) => ({
      recent: [],
      favorites: [],
      searchHistory: [],

      addRecent: (fileId) =>
        set((state) => {
          const withoutExisting = state.recent.filter((r) => r.fileId !== fileId);
          const next = [{ fileId, openedAt: Date.now() }, ...withoutExisting].slice(
            0,
            MAX_RECENT,
          );
          return { recent: next };
        }),

      removeRecent: (fileId) =>
        set((state) => ({ recent: state.recent.filter((r) => r.fileId !== fileId) })),

      clearRecent: () => set({ recent: [] }),

      toggleFavorite: (fileId) =>
        set((state) => ({
          favorites: state.favorites.includes(fileId)
            ? state.favorites.filter((id) => id !== fileId)
            : [...state.favorites, fileId],
        })),

      isFavorite: (fileId) => get().favorites.includes(fileId),

      addSearchHistory: (entry) =>
        set((state) => ({
          searchHistory: [entry, ...state.searchHistory].slice(0, MAX_SEARCH_HISTORY),
        })),

      clearSearchHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: "np-recent",
      storage: createJSONStorage(() => zustandLocalStorage),
    },
  ),
);
