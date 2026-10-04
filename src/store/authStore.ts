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

export const useAuthStore = create<AuthState>()((set) => ({
  status: "loading",
  user: null,
  workspaceReady: false,
  setAuthenticated: (user) => set({ status: "authenticated", user }),
  setGuest: () => set({ status: "guest", user: null, workspaceReady: true }),
  setWorkspaceReady: () => set({ workspaceReady: true }),
}));
