"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SkeletonText } from "@/components/ui/skeleton";
import { LoadFailure } from "@/components/ui/load-failure";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAdminViewStore } from "@/store/adminViewStore";
import { useAuthStore } from "@/store/authStore";
import { fetchJson, jsonBody } from "@/lib/api/fetchJson";
import { cn } from "@/lib/utils";
import { AdminAiConfigSection } from "./AdminAiConfigSection";

interface AdminUserDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  isBootstrapAdmin: boolean;
  blocked: boolean;
  createdAt: number;
}

function formatJoined(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PAGE_SIZE = 10;

/** Admin-only view — mirrors MarkdownFullPageView's header/body shape as the established
 *  "full view replaces the editor" pattern (see EditorArea's view-switch). Contains dedicated
 *  sections for User Management and AI Intelligence Configuration. */
export function AdminView() {
  const close = useAdminViewStore((s) => s.close);
  const activeSection = useAdminViewStore((s) => s.section);
  const setSection = useAdminViewStore((s) => s.setSection);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [users, setUsers] = useState<AdminUserDto[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [filter, setFilter] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  function load() {
    fetchJson<AdminUserDto[]>("/api/admin/users", { action: "Load users" })
      .then(setUsers)
      .catch((err: unknown) => setError(err));
  }

  useEffect(load, []);

  async function patchUser(
    id: string,
    patch: { isAdmin?: boolean; blocked?: boolean },
  ) {
    setSavingId(id);
    try {
      const updated = await fetchJson<AdminUserDto>(`/api/admin/users/${id}`, {
        ...jsonBody("PATCH", patch),
        action: "Update user",
      });
      setUsers((prev) => prev?.map((u) => (u.id === id ? updated : u)) ?? prev);
    } catch {
      toast.error("Couldn't update that user.");
    } finally {
      setSavingId(null);
    }
  }

  const filtered = users?.filter((u) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q)
    );
  });

  const pageCount = filtered
    ? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    : 1;
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered?.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-[var(--np-toolbar-bg)] px-3 text-sm">
        <div className="flex items-center gap-2 pr-2 border-r border-border/60">
          <ShieldCheck className="text-primary size-4 shrink-0" />
          <span className="font-semibold text-xs tracking-tight">Admin Panel</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSection("users")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
              activeSection === "users"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <UsersIcon className="size-3.5" />
            <span>Users</span>
            {users && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  activeSection === "users"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {users.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSection("ai-config")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
              activeSection === "ai-config"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <Bot className="size-3.5" />
            <span>AI Configuration</span>
          </button>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button size="sm" variant="ghost" onClick={close} title="Close" className="h-7 text-xs gap-1 cursor-pointer">
            <X className="size-3.5" />
            <span className="hidden sm:inline">Close</span>
          </Button>
        </div>
      </div>

      <div className="np-scrollbar bg-background h-full overflow-auto px-6 py-4">
        {activeSection === "ai-config" ? (
          <AdminAiConfigSection />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold">Users</h1>
              <p className="text-muted-foreground text-sm">
                {users
                  ? `${users.length} user${users.length === 1 ? "" : "s"}`
                  : "Loading…"}
              </p>
            </div>
            <Input
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by name or email…"
              className="h-8 w-64"
              aria-label="Filter users"
            />
          </div>

          {error ? (
            <LoadFailure
              error={error}
              onRetry={() => {
                setError(null);
                load();
              }}
            />
          ) : !filtered ? (
            <SkeletonText lines={6} />
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No users match this filter.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Joined</th>
                    <th className="px-3 py-2 font-medium">Admin</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pageItems?.map((u) => {
                    const isSelf = u.id === currentUserId;
                    const adminToggleLocked =
                      u.isBootstrapAdmin || savingId === u.id;
                    const blockControlLocked = isSelf || u.isBootstrapAdmin;
                    return (
                      <tr key={u.id}>
                        <td className="px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            {u.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.avatarUrl}
                                alt=""
                                className="size-6 shrink-0 rounded-full"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                {(u.name ?? u.email).charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="truncate font-medium">
                              {u.name ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="text-muted-foreground px-3 py-2">
                          {u.email}
                        </td>
                        <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                          {formatJoined(u.createdAt)}
                        </td>
                        <td className="px-3 py-2">
                          <Switch
                            checked={u.isAdmin || u.isBootstrapAdmin}
                            disabled={adminToggleLocked}
                            title={
                              u.isBootstrapAdmin
                                ? "Primary admin — can't be changed"
                                : undefined
                            }
                            onCheckedChange={(checked) =>
                              void patchUser(u.id, { isAdmin: checked })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          {u.blocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingId === u.id}
                              onClick={() =>
                                void patchUser(u.id, { blocked: false })
                              }
                            >
                              Blocked — Unblock
                            </Button>
                          ) : blockControlLocked ? (
                            <span className="text-muted-foreground text-xs">
                              {isSelf ? "You" : "Protected"}
                            </span>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={savingId === u.id}
                                >
                                  Block
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Block {u.name ?? u.email}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    They&apos;ll be signed out immediately and
                                    won&apos;t be able to sign back in until
                                    unblocked.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      void patchUser(u.id, { blocked: true })
                                    }
                                  >
                                    Block
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3.5" /> Previous
                </Button>
                <span className="text-muted-foreground px-1">
                  Page {safePage} of {pageCount}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Next <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
