import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { migrateOrLoadCloudWorkspace } from "@/services/auth/migrateGuestWorkspace";

/** Runs once on mount: checks for an existing session and, if found, loads the cloud workspace. */
export function useAuthBootstrap(): void {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          useAuthStore.getState().setGuest();
          return;
        }
        const user = await res.json();
        useAuthStore.getState().setAuthenticated(user);
        await migrateOrLoadCloudWorkspace();
        useAuthStore.getState().setWorkspaceReady();
      } catch (err) {
        console.error("Auth check failed:", err);
        useAuthStore.getState().setGuest();
      }
    })();
  }, []);
}
