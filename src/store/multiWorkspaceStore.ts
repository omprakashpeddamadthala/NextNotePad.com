import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandLocalStorage } from "@/services/storage/localStorageService";
import { fetchJson, jsonBody } from "@/lib/api/fetchJson";
import { toast } from "sonner";
import {
  cacheWorkspaceList,
  getCachedWorkspaceListSync,
  loadWorkspaceList,
  type WorkspaceListResponse,
} from "@/services/storage/driveDataClient";

export interface WorkspaceRecord {
  id: string;
  name: string;
  description: string | null;
  driveWorkspaceFolderId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MultiWorkspaceState {
  workspaces: WorkspaceRecord[];
  activeWorkspaceId: string | null;
  loadingWorkspaces: boolean;
  creatingWorkspace: boolean;
  renamingWorkspace: boolean;
  deletingWorkspace: boolean;
  switchingWorkspace: boolean;
  createModalOpen: boolean;
  renameModalOpen: boolean;
  deleteModalOpen: boolean;
  targetWorkspaceId: string | null;
  loadError: string | null;
}

interface MultiWorkspaceActions {
  loadWorkspaces: (options?: {
    force?: boolean;
    background?: boolean;
  }) => Promise<void>;
  hydrateWorkspaceList: (data: WorkspaceListResponse) => void;
  switchWorkspace: (
    workspaceId: string,
    options?: { background?: boolean },
  ) => Promise<boolean>;
  createWorkspace: (
    name: string,
    description?: string,
  ) => Promise<WorkspaceRecord | null>;
  renameWorkspace: (
    id: string,
    name: string,
    description?: string,
  ) => Promise<boolean>;
  deleteWorkspace: (id: string) => Promise<boolean>;
  setCreateModalOpen: (open: boolean) => void;
  setRenameModalOpen: (open: boolean, workspaceId?: string) => void;
  setDeleteModalOpen: (open: boolean, workspaceId?: string) => void;
  updateWorkspaceLocally: (id: string, patch: Partial<WorkspaceRecord>) => void;
  removeWorkspaceLocally: (id: string) => void;
  reset: () => void;
}

const initialState: MultiWorkspaceState = {
  workspaces: [],
  activeWorkspaceId: null,
  loadingWorkspaces: false,
  creatingWorkspace: false,
  renamingWorkspace: false,
  deletingWorkspace: false,
  switchingWorkspace: false,
  createModalOpen: false,
  renameModalOpen: false,
  deleteModalOpen: false,
  targetWorkspaceId: null,
  loadError: null,
};

export const useMultiWorkspaceStore = create<
  MultiWorkspaceState & MultiWorkspaceActions
>()(
  persist(
    (set, get) => ({
      ...initialState,

      hydrateWorkspaceList: (data) =>
        set({
          workspaces: data.workspaces,
          activeWorkspaceId: data.activeWorkspaceId,
          loadingWorkspaces: false,
          loadError: null,
        }),

      loadWorkspaces: async (options = {}) => {
        const cached = getCachedWorkspaceListSync();
        if (cached && get().workspaces.length === 0) {
          set({
            workspaces: cached.workspaces,
            activeWorkspaceId: cached.activeWorkspaceId,
          });
        }
        if (get().workspaces.length === 0)
          set({ loadingWorkspaces: true, loadError: null });
        try {
          const data = await loadWorkspaceList({
            ...options,
            onFresh: (fresh) => get().hydrateWorkspaceList(fresh),
          });
          set({
            workspaces: data.workspaces,
            activeWorkspaceId: data.activeWorkspaceId,
            loadingWorkspaces: false,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to load workspaces.";
          set({ loadingWorkspaces: false, loadError: message });
        }
      },

      switchWorkspace: async (
        workspaceId: string,
        options: { background?: boolean } = {},
      ) => {
        const { activeWorkspaceId } = get();
        if (activeWorkspaceId === workspaceId) return true;

        if (!options.background) {
          set({ activeWorkspaceId: workspaceId, switchingWorkspace: true });
        } else {
          set({ activeWorkspaceId: workspaceId });
        }

        try {
          const workspace = await fetchJson<WorkspaceRecord>(
            `/api/workspaces/${workspaceId}/switch`,
            {
              method: "POST",
              action: "Switch workspace",
              background: options.background,
            },
          );
          set({ activeWorkspaceId: workspace.id, switchingWorkspace: false });
          void cacheWorkspaceList({
            workspaces: get().workspaces,
            activeWorkspaceId: workspace.id,
          });
          return true;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to switch workspace.";
          if (!options.background) {
            toast.error(message);
            set({
              activeWorkspaceId,
              switchingWorkspace: false,
            });
          }
          return false;
        }
      },

      createWorkspace: async (name: string, description?: string) => {
        set({ creatingWorkspace: true });
        try {
          const workspace = await fetchJson<WorkspaceRecord>(
            "/api/workspaces",
            {
              ...jsonBody("POST", { name, description }),
              action: "Create workspace",
            },
          );

          set((state) => ({
            workspaces: [...state.workspaces, workspace],
            activeWorkspaceId: workspace.id,
            creatingWorkspace: false,
            createModalOpen: false,
          }));
          void cacheWorkspaceList({
            workspaces: get().workspaces,
            activeWorkspaceId: workspace.id,
          });

          toast.success(`Workspace "${workspace.name}" created successfully.`);
          return workspace;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to create workspace.";
          toast.error(message);
          set({ creatingWorkspace: false });
          return null;
        }
      },

      renameWorkspace: async (
        id: string,
        name: string,
        description?: string,
      ) => {
        set({ renamingWorkspace: true });
        try {
          const updated = await fetchJson<WorkspaceRecord>(
            `/api/workspaces/${id}`,
            {
              ...jsonBody("PATCH", { name, description }),
              action: "Rename workspace",
            },
          );

          set((state) => ({
            workspaces: state.workspaces.map((w) =>
              w.id === id ? updated : w,
            ),
            renamingWorkspace: false,
            renameModalOpen: false,
            targetWorkspaceId: null,
          }));
          void cacheWorkspaceList({
            workspaces: get().workspaces,
            activeWorkspaceId: get().activeWorkspaceId,
          });

          toast.success(`Workspace renamed to "${updated.name}".`);
          return true;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to rename workspace.";
          toast.error(message);
          set({ renamingWorkspace: false });
          return false;
        }
      },

      deleteWorkspace: async (id: string) => {
        set({ deletingWorkspace: true });
        try {
          await fetchJson<{ success: boolean }>(`/api/workspaces/${id}`, {
            method: "DELETE",
            action: "Delete workspace",
          });

          const { workspaces, activeWorkspaceId } = get();
          const remaining = workspaces.filter((w) => w.id !== id);
          const wasActive = activeWorkspaceId === id;
          const nextActiveId = wasActive
            ? (remaining[0]?.id ?? null)
            : activeWorkspaceId;

          set({
            workspaces: remaining,
            activeWorkspaceId: nextActiveId,
            deletingWorkspace: false,
            deleteModalOpen: false,
            targetWorkspaceId: null,
          });
          void cacheWorkspaceList({
            workspaces: remaining,
            activeWorkspaceId: nextActiveId,
          });

          toast.success("Workspace deleted successfully.");
          return true;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to delete workspace.";
          toast.error(message);
          set({ deletingWorkspace: false });
          return false;
        }
      },

      setCreateModalOpen: (open: boolean) => set({ createModalOpen: open }),

      setRenameModalOpen: (open: boolean, workspaceId?: string) =>
        set({ renameModalOpen: open, targetWorkspaceId: workspaceId ?? null }),

      setDeleteModalOpen: (open: boolean, workspaceId?: string) =>
        set({ deleteModalOpen: open, targetWorkspaceId: workspaceId ?? null }),

      updateWorkspaceLocally: (id, patch) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === id ? { ...w, ...patch } : w,
          ),
        })),

      removeWorkspaceLocally: (id) =>
        set((state) => {
          const remaining = state.workspaces.filter((w) => w.id !== id);
          const newActiveId =
            state.activeWorkspaceId === id
              ? (remaining[0]?.id ?? null)
              : state.activeWorkspaceId;
          return { workspaces: remaining, activeWorkspaceId: newActiveId };
        }),

      reset: () => set(initialState),
    }),
    {
      name: "np-multi-workspace",
      storage: createJSONStorage(() => zustandLocalStorage),
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    },
  ),
);
