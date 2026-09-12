"use client";

import { useState } from "react";
import {
  LogIn,
  LogOut,
  User as UserIcon,
  CloudDownload,
  Loader2,
  ShieldCheck,
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
        variant="outline"
        className="border-primary/25 bg-primary/10 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-xs"
        onClick={() => {
          // A real full-page navigation is required here — this hits an API route that 302s
          // to Google's consent screen, not an internal Next.js page.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/api/auth/google";
        }}
      >
        <LogIn className="size-3.5" /> Sign in with Google
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
          {syncing ? "Syncing…" : "Sync from Drive"}
        </DropdownMenuItem>
        {user.isAdmin && (
          <DropdownMenuItem
            onSelect={() => useAdminViewStore.getState().open()}
          >
            <ShieldCheck /> Admin Panel
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
