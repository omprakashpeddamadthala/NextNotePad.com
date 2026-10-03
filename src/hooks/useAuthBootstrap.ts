import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { fetchJson, ApiError } from "@/lib/api/fetchJson";
import { migrateOrLoadCloudWorkspace } from "@/services/auth/migrateGuestWorkspace";
import { syncSettingsOnLogin } from "@/services/settingsSync";
import { configureDriveDataClient } from "@/services/storage/driveDataClient";
import * as cloudRepo from "@/services/storage/cloudWorkspaceRepository";
import { useWorkspaceStore } from "@/store/workspaceStore";

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
        const [loadedWorkspaceId] = await Promise.all([
          migrateOrLoadCloudWorkspace(),
          useMultiWorkspaceStore.getState().loadWorkspaces(),
          syncSettingsOnLogin(),
        ]);
        const activeWorkspaceId =
          useMultiWorkspaceStore.getState().activeWorkspaceId;
        if (
          activeWorkspaceId &&
          loadedWorkspaceId &&
          activeWorkspaceId !== loadedWorkspaceId
        ) {
          const { nodes } =
            await cloudRepo.fetchWorkspaceTree(activeWorkspaceId);
          useWorkspaceStore
            .getState()
            .replaceAll(
              Object.fromEntries(nodes.map((node) => [node.id, node])),
            );
        }
        // The tree and settings above were read straight from Drive (the source of truth), so
        // there is no separate "pull from Drive" step anymore.
        useAuthStore.getState().setWorkspaceReady();
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
