"use client";

import { useRef, useState } from "react";
import { RotateCcw, Undo2, Redo2, Save, WrapText, Eye, Pencil } from "lucide-react";
import { TabItem } from "./TabItem";
import { ToolbarButton } from "@/components/layout/ToolbarButton";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useDiffViewStore } from "@/store/diffViewStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";
import { runAction } from "@/services/shortcuts/actionRegistry";

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

  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const markdownEditingFileIds = useUIStore((s) => s.markdownEditingFileIds);
  const setMarkdownEditing = useUIStore((s) => s.setMarkdownEditing);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeNode = activeTab ? nodes[activeTab.fileId] : undefined;
  const isMarkdown =
    activeNode?.type === "file" &&
    (activeNode.language === "markdown" ||
      activeNode.name.toLowerCase().endsWith(".md") ||
      activeNode.name.toLowerCase().endsWith(".markdown"));

  const isEditingMarkdown = activeTab ? Boolean(markdownEditingFileIds[activeTab.fileId]) : false;

  const dragIndexRef = useRef<number | null>(null);
  const [, forceRerender] = useState(0);

  if (tabs.length === 0) return null;

  return (
    <div
      role="tablist"
      aria-label="Open editor tabs"
      className="np-scrollbar flex h-[38px] shrink-0 items-stretch overflow-x-auto overflow-y-hidden border-b bg-[var(--np-tab-inactive-bg)] select-none"
      style={{ borderBottomColor: "var(--np-tab-border)" }}
    >
      <div className="flex items-stretch min-w-0 flex-1 overflow-x-auto no-scrollbar">
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
      </div>

      {/* ── Quick Editor Actions on tab bar ──────────────────────────────── */}
      <div
        className="flex shrink-0 items-center border-l px-1.5 gap-0.5"
        style={{ borderColor: "var(--np-tab-border)" }}
      >
        {isMarkdown && (
          <ToolbarButton
            icon={isEditingMarkdown ? Eye : Pencil}
            label={isEditingMarkdown ? "View Full Page Markdown" : "Edit Markdown Source"}
            active={!isEditingMarkdown}
            size="compact"
            onClick={() => {
              if (activeTab) {
                setMarkdownEditing(activeTab.fileId, !isEditingMarkdown);
              }
            }}
          />
        )}
        <ToolbarButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          size="compact"
          onClick={() => runAction("edit.undo")}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo (Ctrl+Y)"
          size="compact"
          onClick={() => runAction("edit.redo")}
        />
        <ToolbarButton
          icon={Save}
          label="Save (Ctrl+S)"
          size="compact"
          onClick={() => runAction("file.save")}
        />
        <ToolbarButton
          icon={WrapText}
          label="Toggle Word Wrap (Alt+Z)"
          active={settings.wordWrap}
          size="compact"
          onClick={() => updateSettings({ wordWrap: !settings.wordWrap })}
        />
        {closedStackLength > 0 && (
          <ToolbarButton
            icon={RotateCcw}
            label="Reopen Closed Tab (Ctrl+Shift+T)"
            size="compact"
            onClick={() => reopenClosed()}
          />
        )}
      </div>
    </div>
  );
}
