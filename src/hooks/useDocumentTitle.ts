"use client";

import { useEffect } from "react";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { APP_BRAND } from "@/lib/constants/branding";

export function useDocumentTitle(): void {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const dirtyTabIds = useTabsStore((s) => s.dirtyTabIds);
  const nodes = useWorkspaceStore((s) => s.nodes);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) {
      document.title = APP_BRAND.name;
      return;
    }

    const node = nodes[activeTab.fileId];
    const name = node?.name || "Untitled";
    const isDirty = Boolean(dirtyTabIds[activeTab.id]);

    document.title = `${isDirty ? "● " : ""}${name} — ${APP_BRAND.name}`;
  }, [tabs, activeTabId, dirtyTabIds, nodes]);
}
