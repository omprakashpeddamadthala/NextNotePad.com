import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
}

type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  workspaceReady: boolean;
  setAuthenticated: (user: AuthUser) => void;
  setGuest: () => void;
  setWorkspaceReady: () => void;
}

// UI hint only (no user data): lets the first render show the Drive loading
// screen before /api/auth/me answers. The session cookie stays the authority.
const SIGNED_IN_HINT_KEY = "np-signed-in";

function writeSignedInHint(signedIn: boolean): void {
  try {
    if (signedIn) window.localStorage.setItem(SIGNED_IN_HINT_KEY, "1");
    else window.localStorage.removeItem(SIGNED_IN_HINT_KEY);
  } catch {}
}

export function hasSignedInHint(): boolean {
  try {
    return window.localStorage.getItem(SIGNED_IN_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: "loading",
  user: null,
  workspaceReady: false,
  setAuthenticated: (user) => {
    writeSignedInHint(true);
    set({ status: "authenticated", user });
  },
  setGuest: () => {
    writeSignedInHint(false);
    set({ status: "guest", user: null, workspaceReady: true });
  },
  setWorkspaceReady: () => set({ workspaceReady: true }),
}));
