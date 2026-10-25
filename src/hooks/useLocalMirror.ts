"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useLocalMirrorStore } from "@/store/localMirrorStore";
import {
  reconnectLocalMirror,
  startLocalMirror,
  stopLocalMirror,
} from "@/services/storage/localMirror/localMirrorService";

/** Starts the local folder mirror for the signed-in user, if one is set up. */
export function useLocalMirror(): void {
  const userId = useAuthStore((s) =>
    s.status === "authenticated" && s.workspaceReady ? (s.user?.id ?? null) : null,
  );
  const status = useLocalMirrorStore((s) => s.status);
  const folderName = useLocalMirrorStore((s) => s.folderName);

  useEffect(() => {
    if (!userId) return;
    void startLocalMirror(userId);
    return () => stopLocalMirror();
  }, [userId]);

  // Browsers only re-grant folder access from a click, so ask with a toast.
  useEffect(() => {
    if (status !== "needs-permission" || !folderName) return;
    const id = toast(`Local folder sync is paused`, {
      description: `Allow access to "${folderName}" to keep your local copy up to date.`,
      duration: Infinity,
      action: {
        label: "Allow",
        onClick: () => void reconnectLocalMirror(),
      },
    });
    return () => {
      toast.dismiss(id);
    };
  }, [status, folderName]);
}
