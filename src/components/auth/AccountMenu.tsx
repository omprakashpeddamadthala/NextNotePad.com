"use client";

import { useState } from "react";
import {
  LogOut,
  User as UserIcon,
  CloudDownload,
  Loader2,
  ShieldCheck,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useAdminViewStore } from "@/store/adminViewStore";
import { syncFromDrive } from "@/services/driveImport";
import { fetchOk } from "@/lib/api/fetchJson";

function initialsFor(name: string | null, email: string): string {
  const source = name?.trim() || email;
  return source.slice(0, 1).toUpperCase();
}

async function handleSignOut() {
  try {
    await fetchOk("/api/auth/logout", { method: "POST", action: "Sign out" });
  } catch {
    // Reload regardless: an unhandled rejection here used to leave the menu looking frozen with
    // no feedback at all. Reloading re-checks the session, so a failed sign-out is self-evident.
    toast.error("Sign out may not have completed — check your connection.");
  }
  window.location.reload();
}

export function AccountMenu() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const [syncing, setSyncing] = useState(false);

  async function handleSyncFromDrive() {
    setSyncing(true);
    try {
      await syncFromDrive();
    } finally {
      setSyncing(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="bg-muted size-6 shrink-0 rounded-full" aria-hidden />
    );
  }

  if (status === "guest") {
    return (
      <Button
        size="sm"
        className="np-signin-btn h-7.5 cursor-pointer gap-2 px-3 text-[11.5px] font-medium shadow-sm transition-all duration-200"
        onClick={() => {
          // A real full-page navigation is required here — this hits an API route that 302s
          // to Google's consent screen, not an internal Next.js page.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/api/auth/google";
        }}
      >
        <svg
          className="size-3.5 shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign in with Google</span>
      </Button>
    );
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:border-border/70 hover:bg-accent focus-visible:ring-ring/30 flex h-8 shrink-0 items-center gap-2 rounded-lg border border-transparent px-2 text-xs font-semibold transition-[color,background-color,border-color] outline-none focus-visible:ring-2">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="ring-primary/20 size-5 shrink-0 rounded-full ring-1"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold shadow-xs">
            {initialsFor(user.name, user.email)}
          </span>
        )}
        <span className="max-w-40 truncate">{user.name ?? user.email}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2">
            <UserIcon className="size-3.5" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user.name ?? "Signed in"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={syncing}
          onSelect={(e) => {
            e.preventDefault();
            void handleSyncFromDrive();
          }}
        >
          {syncing ? <Loader2 className="animate-spin" /> : <CloudDownload />}
          {syncing ? "Refreshing…" : "Refresh from Drive"}
        </DropdownMenuItem>
        {user.isAdmin && (
          <>
            <DropdownMenuItem
              onSelect={() => useAdminViewStore.getState().open("users")}
            >
              <ShieldCheck /> Admin Panel
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => useAdminViewStore.getState().open("ai-config")}
            >
              <Bot /> AI Configuration
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
