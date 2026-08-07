import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TrashEntry } from "@/types/file";
import { zustandLocalStorage } from "@/services/storage/localStorageService";

interface TrashState {
  entries: TrashEntry[];
}

interface TrashActions {
  addEntry: (entry: TrashEntry) => void;
  removeEntry: (nodeId: string) => TrashEntry | undefined;
  emptyTrash: () => void;
}

export const useTrashStore = create<TrashState & TrashActions>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),

      removeEntry: (nodeId) => {
        const entry = get().entries.find((e) => e.node.id === nodeId);
        set((state) => ({ entries: state.entries.filter((e) => e.node.id !== nodeId) }));
        return entry;
      },

      emptyTrash: () => set({ entries: [] }),
    }),
    {
      name: "np-trash",
      storage: createJSONStorage(() => zustandLocalStorage),
    },
  ),
);
