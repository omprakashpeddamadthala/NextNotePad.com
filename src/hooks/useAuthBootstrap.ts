import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import { fetchJson, ApiError } from "@/lib/api/fetchJson";
import { migrateOrLoadCloudWorkspace } from "@/services/auth/migrateGuestWorkspace";
import { syncSettingsOnLogin } from "@/services/settingsSync";
import { autoSyncFromDriveOnLogin } from "@/services/driveImport";

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
          message = "Sign-in session expired or state mismatch. Please try signing in again.";
        } else if (authError === "access_denied") {
          message = "Google Sign-in was cancelled or access was denied.";
        } else if (authError === "oauth_failed") {
          message = "Google OAuth authentication failed. Please try again.";
        }
        toast.error(message);
        const url = new URL(window.location.href);
        url.searchParams.delete("authError");
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    }

    (async () => {
      try {
        // Goes through the shared client so the startup auth + workspace load drives the same
        // progress indicator as every other API call. A 401 here just means "not signed in",
        // which the catch below turns into guest mode rather than an error.
        const user = await fetchJson<AuthUser>("/api/auth/me", { action: "Check session" });
        useAuthStore.getState().setAuthenticated(user);
        await migrateOrLoadCloudWorkspace();
        await syncSettingsOnLogin();
        useAuthStore.getState().setWorkspaceReady();
        // Fire-and-forget: catches up with anything sitting in Drive (added from another
        // device/browser, or directly in Drive) without delaying the workspace becoming usable.
        void autoSyncFromDriveOnLogin();
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
