/**
 * Multi-workspace Zustand store.
 *
 * Manages the list of workspaces and which one is currently active.
 * The active workspace drives what the sidebar shows and what API routes target.
 *
 * Persistence: activeWorkspaceId is persisted in localStorage as a fast hint for the
 * initial render. The authoritative source of truth is the server (User.activeWorkspaceId).
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandLocalStorage } from "@/services/storage/localStorageService";
import { fetchJson, jsonBody } from "@/lib/api/fetchJson";
import { toast } from "sonner";

export interface WorkspaceRecord {
  id: string;
  name: string;
  description: string | null;
  driveWorkspaceFolderId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MultiWorkspaceState {
  /** All workspaces for the current user. Empty until loaded. */
  workspaces: WorkspaceRecord[];
  /** ID of the currently active workspace. */
  activeWorkspaceId: string | null;
  /** True while the workspace list is being fetched. */
  loadingWorkspaces: boolean;
  /** True while a new workspace is being created. */
  creatingWorkspace: boolean;
  /** True while a workspace is being renamed. */
  renamingWorkspace: boolean;
  /** True while a workspace is being deleted. */
  deletingWorkspace: boolean;
  /** True while switching between workspaces. */
  switchingWorkspace: boolean;
  /** Controls the Create Workspace modal. */
  createModalOpen: boolean;
  /** Controls the Rename Workspace modal. */
  renameModalOpen: boolean;
  /** Controls the Delete Workspace modal. */
  deleteModalOpen: boolean;
  /** Target workspace ID for rename or delete operations. */
  targetWorkspaceId: string | null;
  /** Any error loading workspaces. */
  loadError: string | null;
}

interface MultiWorkspaceActions {
  /** Load the workspace list from the server. Call on app startup (authenticated users only). */
  loadWorkspaces: () => Promise<void>;
  /**
   * Switch to a different workspace.
   * This persists the choice server-side and updates local state.
   * Callers should reset the workspace file tree after this completes.
   */
  switchWorkspace: (workspaceId: string) => Promise<void>;
  /**
   * Create a new workspace (including its Drive folder).
   * On success, automatically switches to the new workspace.
   */
  createWorkspace: (name: string, description?: string) => Promise<WorkspaceRecord | null>;
  /** Rename an existing workspace. */
  renameWorkspace: (id: string, name: string, description?: string) => Promise<boolean>;
  /** Delete a workspace. */
  deleteWorkspace: (id: string) => Promise<boolean>;
  /** Open/close the Create Workspace modal. */
  setCreateModalOpen: (open: boolean) => void;
  /** Open/close the Rename Workspace modal. */
  setRenameModalOpen: (open: boolean, workspaceId?: string) => void;
  /** Open/close the Delete Workspace modal. */
  setDeleteModalOpen: (open: boolean, workspaceId?: string) => void;
  /** Update a workspace name/description in local state after a PATCH. */
  updateWorkspaceLocally: (id: string, patch: Partial<WorkspaceRecord>) => void;
  /** Remove a workspace from local state after a DELETE. */
  removeWorkspaceLocally: (id: string) => void;
  /** Reset store to initial state (called on sign out). */
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

export const useMultiWorkspaceStore = create<MultiWorkspaceState & MultiWorkspaceActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadWorkspaces: async () => {
        set({ loadingWorkspaces: true, loadError: null });
        try {
          const data = await fetchJson<{ workspaces: WorkspaceRecord[]; activeWorkspaceId: string | null }>(
            "/api/workspaces",
            { action: "Load workspaces" },
          );
          set({
            workspaces: data.workspaces,
            activeWorkspaceId: data.activeWorkspaceId,
            loadingWorkspaces: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to load workspaces.";
          set({ loadingWorkspaces: false, loadError: message });
        }
      },

      switchWorkspace: async (workspaceId: string) => {
        const { activeWorkspaceId } = get();
        if (activeWorkspaceId === workspaceId) return;

        set({ switchingWorkspace: true });
        try {
          const workspace = await fetchJson<WorkspaceRecord>(
            `/api/workspaces/${workspaceId}/switch`,
            { method: "POST", action: "Switch workspace" },
          );
          set({ activeWorkspaceId: workspace.id, switchingWorkspace: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to switch workspace.";
          toast.error(message);
          set({ switchingWorkspace: false });
        }
      },

      createWorkspace: async (name: string, description?: string) => {
        set({ creatingWorkspace: true });
        try {
          const workspace = await fetchJson<WorkspaceRecord>("/api/workspaces", {
            ...jsonBody("POST", { name, description }),
            action: "Create workspace",
          });

          set((state) => ({
            workspaces: [...state.workspaces, workspace],
            activeWorkspaceId: workspace.id,
            creatingWorkspace: false,
            createModalOpen: false,
          }));

          toast.success(`Workspace "${workspace.name}" created successfully.`);
          return workspace;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to create workspace.";
          toast.error(message);
          set({ creatingWorkspace: false });
          return null;
        }
      },

      renameWorkspace: async (id: string, name: string, description?: string) => {
        set({ renamingWorkspace: true });
        try {
          const updated = await fetchJson<WorkspaceRecord>(`/api/workspaces/${id}`, {
            ...jsonBody("PATCH", { name, description }),
            action: "Rename workspace",
          });

          set((state) => ({
            workspaces: state.workspaces.map((w) => (w.id === id ? updated : w)),
            renamingWorkspace: false,
            renameModalOpen: false,
            targetWorkspaceId: null,
          }));

          toast.success(`Workspace renamed to "${updated.name}".`);
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to rename workspace.";
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
          const nextActiveId = wasActive ? (remaining[0]?.id ?? null) : activeWorkspaceId;

          set({
            workspaces: remaining,
            activeWorkspaceId: nextActiveId,
            deletingWorkspace: false,
            deleteModalOpen: false,
            targetWorkspaceId: null,
          });

          toast.success("Workspace deleted successfully.");
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to delete workspace.";
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
          workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),

      removeWorkspaceLocally: (id) =>
        set((state) => {
          const remaining = state.workspaces.filter((w) => w.id !== id);
          const newActiveId =
            state.activeWorkspaceId === id ? (remaining[0]?.id ?? null) : state.activeWorkspaceId;
          return { workspaces: remaining, activeWorkspaceId: newActiveId };
        }),

      reset: () => set(initialState),
    }),
    {
      name: "np-multi-workspace",
      storage: createJSONStorage(() => zustandLocalStorage),
      // Only persist the active workspace ID as a fast-load hint.
      // The actual list is always fetched fresh from the server.
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    },
  ),
);
