"use client";

import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const POLL_INTERVAL_MS = 20000;

async function fetchSyncStatus(): Promise<number> {
  const res = await fetch("/api/sync/status");
  if (!res.ok) throw new Error(`Sync status failed (${res.status})`);
  const data = await res.json();
  return data.count ?? 0;
}

async function retrySync(): Promise<number> {
  const res = await fetch("/api/sync/retry", { method: "POST" });
  if (!res.ok) throw new Error(`Sync retry failed (${res.status})`);
  const data = await res.json();
  return data.remaining ?? 0;
}

/** Shown only while signed in and only when there's something to report — silent otherwise. */
export function SyncStatusBadge() {
  const status = useAuthStore((s) => s.status);
  const authenticated = status === "authenticated";
  const queryClient = useQueryClient();

  // refetchIntervalInBackground defaults to false, so polling pauses while the tab isn't
  // focused — cheaper than the old setInterval, which kept polling in a backgrounded tab.
  const { data: failureCount = 0 } = useQuery({
    queryKey: ["sync-status"],
    queryFn: fetchSyncStatus,
    enabled: authenticated,
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS,
  });

  const retryMutation = useMutation({
    mutationFn: retrySync,
    onSuccess: (remaining) => {
      queryClient.setQueryData(["sync-status"], remaining);
      if (remaining === 0) toast.success("All files synced to Drive.");
      else toast.error(`${remaining} item${remaining === 1 ? "" : "s"} still failing to sync.`);
    },
    onError: () => toast.error("Retry failed — check your connection."),
  });

  if (!authenticated || failureCount === 0) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-6 gap-1.5 border-amber-500/50 px-2 text-xs text-amber-700 dark:text-amber-400"
      onClick={() => retryMutation.mutate()}
      disabled={retryMutation.isPending}
    >
      {retryMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <AlertTriangle className="size-3.5" />}
      {failureCount} sync issue{failureCount === 1 ? "" : "s"} — Retry
    </Button>
  );
}
