"use client";

import { useState } from "react";
import { LogIn, LogOut, User as UserIcon, CloudDownload, Loader2 } from "lucide-react";
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
    return <div className="size-6 shrink-0 rounded-full bg-muted" aria-hidden />;
  }

  if (status === "guest") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-6 gap-1.5 px-2 text-xs"
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
      <DropdownMenuTrigger className="flex shrink-0 items-center gap-1.5 rounded-sm px-1 py-0.5 text-xs outline-none hover:bg-[var(--np-menu-hover)]">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="size-5 shrink-0 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
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
              <p className="truncate text-sm font-medium">{user.name ?? "Signed in"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
