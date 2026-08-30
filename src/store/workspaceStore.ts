import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WorkspaceNode } from "@/types/file";
import type { NodeMap } from "@/lib/utils/treeUtils";
import { guestOnlyLocalStorage } from "@/services/storage/localStorageService";

interface WorkspaceState {
  nodes: NodeMap;
  filterQuery: string;
}

interface WorkspaceActions {
  addNode: (node: WorkspaceNode) => void;
  addNodes: (nodes: WorkspaceNode[]) => void;
  updateNode: (id: string, patch: Partial<WorkspaceNode>) => void;
  updatePaths: (patch: Record<string, string>) => void;
  removeNode: (id: string) => void;
  removeNodes: (ids: string[]) => void;
  setCollapsed: (id: string, collapsed: boolean) => void;
  setFilterQuery: (query: string) => void;
  replaceAll: (nodes: NodeMap) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set) => ({
      nodes: {},
      filterQuery: "",

      addNode: (node) =>
        set((state) => ({ nodes: { ...state.nodes, [node.id]: node } })),

      addNodes: (nodes) =>
        set((state) => {
          const next = { ...state.nodes };
          for (const node of nodes) next[node.id] = node;
          return { nodes: next };
        }),

      updateNode: (id, patch) =>
        set((state) => {
          const existing = state.nodes[id];
          if (!existing) return state;
          return {
            nodes: {
              ...state.nodes,
              [id]: { ...existing, ...patch, updatedAt: Date.now() } as WorkspaceNode,
            },
          };
        }),

      updatePaths: (patch) =>
        set((state) => {
          const next = { ...state.nodes };
          for (const [id, path] of Object.entries(patch)) {
            const existing = next[id];
            if (existing) next[id] = { ...existing, path };
          }
          return { nodes: next };
        }),

      removeNode: (id) =>
        set((state) => {
          const next = { ...state.nodes };
          delete next[id];
          return { nodes: next };
        }),

      removeNodes: (ids) =>
        set((state) => {
          const next = { ...state.nodes };
          for (const id of ids) delete next[id];
          return { nodes: next };
        }),

      setCollapsed: (id, collapsed) =>
        set((state) => {
          const existing = state.nodes[id];
          if (!existing || existing.type !== "folder") return state;
          return {
            nodes: { ...state.nodes, [id]: { ...existing, collapsed } },
          };
        }),

      setFilterQuery: (filterQuery) => set({ filterQuery }),

      replaceAll: (nodes) => set({ nodes }),

      clearWorkspace: () => set({ nodes: {}, filterQuery: "" }),
    }),
    {
      name: "np-workspace",
      storage: createJSONStorage(() => guestOnlyLocalStorage),
      partialize: (state) => ({ nodes: state.nodes }),
    },
  ),
);
