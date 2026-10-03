import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { fetchJson, ApiError } from "@/lib/api/fetchJson";
import { migrateOrLoadCloudWorkspace } from "@/services/auth/migrateGuestWorkspace";
import { syncSettingsOnLogin } from "@/services/settingsSync";

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
        toast.error(message);
        const url = new URL(window.location.href);
        url.searchParams.delete("authError");
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
          ({ authenticated?: boolean; user?: AuthUser | null } & Partial<AuthUser>) | null
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
        await migrateOrLoadCloudWorkspace();
        await useMultiWorkspaceStore.getState().loadWorkspaces();
        await syncSettingsOnLogin();
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
