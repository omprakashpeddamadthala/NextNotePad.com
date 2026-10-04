import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { fetchJson, ApiError } from "@/lib/api/fetchJson";
import { migrateOrLoadCloudWorkspace } from "@/services/auth/migrateGuestWorkspace";
import { syncSettingsOnLogin } from "@/services/settingsSync";
import {
  configureDriveDataClient,
  getCachedWorkspaceListSync,
  getCachedWorkspaceTreeSync,
  loadAllWorkspaceTrees,
  prefetchFileContents,
  triggerIdleDrivePrefetch,
  warmDriveCacheFromIndexedDB,
} from "@/services/storage/driveDataClient";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { WorkspaceNode } from "@/types/file";

export function useAuthBootstrap(): void {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get("authError");
      if (authError) {
        let message = "Google Sign-in failed. Please try again.";
        if (authError === "invalid_state") {
          message =
            "Sign-in session expired or state mismatch. Please try signing in again.";
        } else if (authError === "access_denied") {
          message = "Google Sign-in was cancelled or access was denied.";
        } else if (authError === "drive_scope_missing") {
          message =
            "NextNotePad needs access to Google Drive to store your files. Please sign in again and allow Google Drive access.";
        } else if (authError === "oauth_failed") {
          message = "Google OAuth authentication failed. Please try again.";
        }
        const authReason = params.get("authReason");
        toast.error(
          message,
          authReason ? { description: `Reason: ${authReason}` } : undefined,
        );
        if (authReason) console.error("[auth] Sign-in failed:", authReason);
        const url = new URL(window.location.href);
        url.searchParams.delete("authError");
        url.searchParams.delete("authReason");
        window.history.replaceState(
          {},
          document.title,
          url.pathname + url.search,
        );
      }
    }

    (async () => {
      try {
        const data = await fetchJson<
          | ({
              authenticated?: boolean;
              user?: AuthUser | null;
            } & Partial<AuthUser>)
          | null
        >("/api/auth/me", {
          action: "Check session",
        });

        const user: AuthUser | null =
          data?.user ?? (data?.id && data?.email ? (data as AuthUser) : null);

        if (!user) {
          useAuthStore.getState().setGuest();
          return;
        }

        useAuthStore.getState().setAuthenticated(user);
        configureDriveDataClient(user.id);
        await loadWorkspaceData(user.id);
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.error("Auth check failed:", err);
        }
        useAuthStore.getState().setGuest();
      }
    })();
  }, []);
}

// A signed-in user stays signed in even if Drive data fails to load (first-time Drive setup can
// be slow, Drive may be briefly unreachable, or the Drive permission wasn't granted) — demoting
// them to guest here made new accounts look like they were logged out right after sign-in.
async function loadWorkspaceData(userId: string): Promise<void> {
  try {
    await warmDriveCacheFromIndexedDB(userId);

    const cachedWs = getCachedWorkspaceListSync();
    const activeWsId =
      cachedWs?.activeWorkspaceId || cachedWs?.workspaces[0]?.id;
    let hydratedFromCache = false;
    if (cachedWs && cachedWs.workspaces.length > 0) {
      useMultiWorkspaceStore.getState().hydrateWorkspaceList(cachedWs);
      if (activeWsId) {
        const cachedTree = getCachedWorkspaceTreeSync(activeWsId);
        if (cachedTree && cachedTree.nodes.length > 0) {
          useWorkspaceStore
            .getState()
            .replaceAll(
              Object.fromEntries(cachedTree.nodes.map((n) => [n.id, n])),
            );
          useAuthStore.getState().setWorkspaceReady();
          hydratedFromCache = true;

          const files = cachedTree.nodes.filter(
            (n): n is Extract<WorkspaceNode, { type: "file" }> =>
              n.type === "file" && !n.deleted && !n.locked,
          );
          if (files.length > 0) {
            void prefetchFileContents(
              files.map((f) => ({
                id: f.id,
                version: f.version,
                size: f.size,
              })),
              { limit: 100, concurrency: 5 },
            );
          }
        }
      }
    }

    const [loadedWorkspaceId] = await Promise.all([
      migrateOrLoadCloudWorkspace(),
      syncSettingsOnLogin(),
      loadAllWorkspaceTrees({
        background: true,
        onFresh: (fresh) => {
          useMultiWorkspaceStore.getState().hydrateWorkspaceList({
            workspaces: fresh.workspaces,
            activeWorkspaceId: fresh.activeWorkspaceId,
          });
        },
      }),
    ]);

    const currentActiveId = useMultiWorkspaceStore.getState().activeWorkspaceId;
    if (
      currentActiveId &&
      loadedWorkspaceId &&
      currentActiveId !== loadedWorkspaceId
    ) {
      const { nodes } = await cloudRepo.fetchWorkspaceTree(currentActiveId);
      useWorkspaceStore
        .getState()
        .replaceAll(Object.fromEntries(nodes.map((node) => [node.id, node])));
    }

    if (!hydratedFromCache) {
      useAuthStore.getState().setWorkspaceReady();
    }

    triggerIdleDrivePrefetch();
  } catch (err) {
    console.error("Loading Drive workspace failed:", err);
    toast.error("Couldn't load your Google Drive workspace.", {
      description:
        err instanceof ApiError && err.status === 401
          ? "Google Drive access is missing or expired. Sign out and sign in again, allowing Drive access."
          : "Please refresh the page to try again.",
    });
    useAuthStore.getState().setWorkspaceReady();
  }
}
