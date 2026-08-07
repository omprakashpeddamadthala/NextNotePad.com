import { create } from "zustand";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /**
   * True once tabs/workspace state actually reflects `status` — i.e. the cloud tree has been
   * loaded (and migrated, if this was a first login). `status` flips to "authenticated" as soon
   * as `/api/auth/me` resolves, but `migrateOrLoadCloudWorkspace()` still has async work left
   * (fetch cloud tree, possibly migrate, reset/remap tabs); rendering tabs before that finishes
   * would try to load whatever stale tab was in localStorage against the cloud repo and 404.
   * Guest mode has no such gap — its persisted state already *is* the current state.
   */
  workspaceReady: boolean;
  setAuthenticated: (user: AuthUser) => void;
  setGuest: () => void;
  setWorkspaceReady: () => void;
}

/** Not persisted — the httpOnly session cookie is the real source of truth; we re-check via /api/auth/me on load. */
export const useAuthStore = create<AuthState>()((set) => ({
  status: "loading",
  user: null,
  workspaceReady: false,
  setAuthenticated: (user) => set({ status: "authenticated", user }),
  setGuest: () => set({ status: "guest", user: null, workspaceReady: true }),
  setWorkspaceReady: () => set({ workspaceReady: true }),
}));
