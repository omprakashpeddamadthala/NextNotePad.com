import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { createFile } from "@/services/fileOperations";

const WELCOME_CONTENT = `Welcome to NextNotePad.com
===========================

This is a modern browser-based text editor. Everything you do
here is stored locally in this browser (Guest Mode) — no account required.

Try it out:
  - Ctrl+N            New file
  - Ctrl+P            Quick Open
  - Ctrl+Shift+P       Command Palette
  - Ctrl+F / Ctrl+H    Find / Replace
  - Right-click        Explorer context menu

Delete this file whenever you like — it won't come back.
`;

export function useAppBootstrap(): void {
  const status = useAuthStore((s) => s.status);
  const ranRef = useRef(false);

  useEffect(() => {
    if (status !== "guest" || ranRef.current) return;
    ranRef.current = true;

    const nodes = useWorkspaceStore.getState().nodes;
    if (Object.keys(nodes).length === 0) {
      void createFile(null, "Welcome.txt", WELCOME_CONTENT).then((id) => {
        useTabsStore.getState().openTab(id);
      });
      return;
    }

    if (!useSettingsStore.getState().settings.restoreSession) {
      useTabsStore.getState().resetSession();
    }
  }, [status]);
}
