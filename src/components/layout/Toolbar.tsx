"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  FilePlus,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Search,
  Replace,
  ZoomIn,
  ZoomOut,
  PanelLeft,
  WrapText,
  PanelBottom,
  Command as CommandIcon,
  Braces,
  Eye,
  CalendarDays,
  FileDiff,
} from "lucide-react";
import { toast } from "sonner";
import { ToolbarButton } from "./ToolbarButton";
import { Separator } from "@/components/ui/separator";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { useUIStore } from "@/store/uiStore";
import { useDialogStore } from "@/store/dialogStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { VoiceDictationButton } from "@/components/editor/VoiceDictationButton";
import { openTodayDailyNote } from "@/services/dailyNotes";

export function Toolbar() {
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const bottomPanelVisible = useUIStore((s) => s.bottomPanelVisible);
  const setBottomPanelVisible = useUIStore((s) => s.setBottomPanelVisible);
  const openDialog = useDialogStore((s) => s.openDialog);
  const markdownPreviewVisible = useUIStore((s) => s.markdownPreviewVisible);
  const toggleMarkdownPreview = useUIStore((s) => s.toggleMarkdownPreview);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const activeTabId = useTabsStore((s) => s.activeTabId);
  const activeFileId = useTabsStore(
    (s) => s.tabs.find((t) => t.id === activeTabId)?.fileId,
  );
  const activeNode = useWorkspaceStore((s) =>
    activeFileId ? s.nodes[activeFileId] : undefined,
  );
  const isMarkdownActive =
    activeNode?.type === "file" && activeNode.language === "markdown";

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function updateFades() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }

    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    const resizeObserver = new ResizeObserver(updateFades);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", updateFades);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative shrink-0 border-b bg-[var(--np-toolbar-bg)]">
      <div
        ref={scrollRef}
        role="toolbar"
        aria-label="Editor toolbar"
        className="np-scrollbar flex h-9 items-center gap-0.5 overflow-x-auto overflow-y-hidden px-1"
      >
        <ToolbarButton
          icon={FilePlus}
          label="New File (Ctrl+N)"
          onClick={() => runAction("file.new")}
        />
        <ToolbarButton
          icon={FolderOpen}
          label="Open / Import (Ctrl+O)"
          onClick={() => runAction("file.open")}
        />
        <ToolbarButton
          icon={Save}
          label="Save (Ctrl+S)"
          onClick={() => runAction("file.save")}
        />
        <ToolbarButton
          icon={CalendarDays}
          label="Today's Daily Note"
          onClick={() =>
            void openTodayDailyNote().catch(() =>
              toast.error("Couldn't open today's daily note."),
            )
          }
        />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          onClick={() => runAction("edit.undo")}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo (Ctrl+Y)"
          onClick={() => runAction("edit.redo")}
        />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton
          icon={Search}
          label="Find (Ctrl+F)"
          onClick={() => runAction("search.find")}
        />
        <ToolbarButton
          icon={Replace}
          label="Replace (Ctrl+H)"
          onClick={() => runAction("search.replace")}
        />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton
          icon={Braces}
          label="Format Document / Selection (Shift+Alt+F)"
          onClick={() => runAction("edit.formatDocument")}
        />
        <ToolbarButton
          icon={FileDiff}
          label="Diff Checker"
          onClick={() => runAction("tools.diffChecker")}
        />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <VoiceDictationButton />
        <ToolbarButton
          icon={Eye}
          label="Toggle Markdown Preview"
          active={markdownPreviewVisible && isMarkdownActive}
          onClick={() => {
            if (!isMarkdownActive) {
              toast.error("Open a markdown (.md) file first to preview it.");
              return;
            }
            toggleMarkdownPreview();
          }}
        />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton
          icon={ZoomOut}
          label="Zoom Out"
          onClick={() => runAction("view.zoomOut")}
        />
        <ToolbarButton
          icon={ZoomIn}
          label="Zoom In"
          onClick={() => runAction("view.zoomIn")}
        />
        <ToolbarButton
          icon={WrapText}
          label="Toggle Word Wrap"
          active={settings.wordWrap}
          onClick={() => updateSettings({ wordWrap: !settings.wordWrap })}
        />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton
          icon={PanelLeft}
          label="Toggle File Explorer"
          active={sidebarVisible}
          onClick={() => toggleSidebar()}
        />
        <ToolbarButton
          icon={PanelBottom}
          label="Toggle Bottom Panel"
          active={bottomPanelVisible}
          onClick={() => setBottomPanelVisible(!bottomPanelVisible)}
        />
        <ToolbarButton
          icon={CommandIcon}
          label="Command Palette (Ctrl+Shift+P)"
          onClick={() => openDialog("commandPalette")}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[var(--np-toolbar-bg)] to-transparent transition-opacity"
        style={{ opacity: canScrollLeft ? 1 : 0 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[var(--np-toolbar-bg)] to-transparent transition-opacity"
        style={{ opacity: canScrollRight ? 1 : 0 }}
      />
    </div>
  );
}
