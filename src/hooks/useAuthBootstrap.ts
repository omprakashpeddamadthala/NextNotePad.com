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

/** Runs once on mount: checks for an existing session and, if found, loads the cloud workspace. */
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

        // Rapid warm-up of in-memory cache from IndexedDB
        await warmDriveCacheFromIndexedDB(user.id);

        // Instant UI Hydration: if user has a cached workspace tree in IndexedDB,
        // render immediately to eliminate blank screen / skeleton flicker!
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

              // Immediately prefetch all files in this workspace in background
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

        // Parallel background bootstrap:
        // - migrateOrLoadCloudWorkspace handles guest migration or initial active tree
        // - syncSettingsOnLogin syncs user settings
        // - loadAllWorkspaceTrees prefetches all workspace trees in one unified Drive roundtrip
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

        const currentActiveId =
          useMultiWorkspaceStore.getState().activeWorkspaceId;
        if (
          currentActiveId &&
          loadedWorkspaceId &&
          currentActiveId !== loadedWorkspaceId
        ) {
          const { nodes } =
            await cloudRepo.fetchWorkspaceTree(currentActiveId);
          useWorkspaceStore
            .getState()
            .replaceAll(
              Object.fromEntries(nodes.map((node) => [node.id, node])),
            );
        }

        if (!hydratedFromCache) {
          useAuthStore.getState().setWorkspaceReady();
        }

        // Schedule idle background prefetching for file contents
        triggerIdleDrivePrefetch();
      } catch (err) {
        // A 401 is the normal signed-out path, so only surface the genuinely unexpected ones.
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.error("Auth check failed:", err);
        }
        useAuthStore.getState().setGuest();
      }
    })();
  }, []);
}
