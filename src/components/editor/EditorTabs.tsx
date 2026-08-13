"use client";

import { useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { TabItem } from "./TabItem";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useDiffViewStore } from "@/store/diffViewStore";

export function EditorTabs() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const dirtyTabIds = useTabsStore((s) => s.dirtyTabIds);
  const setActiveTab = useTabsStore((s) => s.setActiveTab);
  const reorderTabs = useTabsStore((s) => s.reorderTabs);
  const reopenClosed = useTabsStore((s) => s.reopenClosed);
  const closedStackLength = useTabsStore((s) => s.closedStack.length);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const addRecent = useRecentFilesStore((s) => s.addRecent);
  const closeDiff = useDiffViewStore((s) => s.closeDiff);

  const dragIndexRef = useRef<number | null>(null);
  const [, forceRerender] = useState(0);

  if (tabs.length === 0) {
    return <div className="h-8 shrink-0 border-b bg-[var(--np-tab-inactive-bg)]" />;
  }

  return (
    <div
      role="tablist"
      aria-label="Open editor tabs"
      className="flex h-8 shrink-0 items-stretch overflow-x-auto overflow-y-hidden border-b np-scrollbar"
    >
      {tabs.map((tab, index) => (
        <TabItem
          key={tab.id}
          tab={tab}
          node={nodes[tab.fileId]}
          isActive={tab.id === activeTabId}
          isDirty={Boolean(dirtyTabIds[tab.id])}
          index={index}
          onActivate={() => {
            closeDiff();
            setActiveTab(tab.id);
            addRecent(tab.fileId);
          }}
          onDragStart={(i) => {
            dragIndexRef.current = i;
          }}
          onDragOver={() => forceRerender((n) => n + 1)}
          onDrop={() => {
            const from = dragIndexRef.current;
            if (from === null) return;
            const to = tabs.findIndex((t) => t.id === tab.id);
            if (from !== to) reorderTabs(from, to);
            dragIndexRef.current = null;
          }}
        />
      ))}
      {closedStackLength > 0 && (
        <div className="flex shrink-0 items-center border-l px-1">
          <ToolbarButton
            icon={RotateCcw}
            label="Reopen Closed Tab (Ctrl+Shift+T)"
            onClick={() => reopenClosed()}
          />
        </div>
      )}
    </div>
  );
}
