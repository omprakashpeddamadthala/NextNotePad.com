"use client";

import {
  PanelLeft,
  PanelBottom,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SplitSquareHorizontal,
  Maximize,
  Lock,
  EyeOff,
  Columns2,
} from "lucide-react";
import { TopMenu } from "./TopMenu";
import {
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { SHORTCUT_BY_ACTION } from "@/lib/constants/shortcuts";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTabsStore } from "@/store/tabsStore";
import { useActiveFile } from "@/hooks/useActiveFile";

export function ViewMenu() {
  const {
    sidebarVisible,
    toggleSidebar,
    bottomPanelVisible,
    setBottomPanelVisible,
    isSplitView,
    setSplitView,
    showHiddenFiles,
    toggleShowHiddenFiles,
    markdownPreviewVisible,
    toggleMarkdownPreview,
  } = useUIStore();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { tab, file } = useActiveFile();
  const setReadOnly = useTabsStore((s) => s.setReadOnly);
  const canPreviewMarkdown =
    file?.type === "file" &&
    (file.language === "markdown" ||
      file.name.toLowerCase().endsWith(".md") ||
      file.name.toLowerCase().endsWith(".markdown")) &&
    !file.locked;

  return (
    <TopMenu label="View">
      <DropdownMenuCheckboxItem
        checked={sidebarVisible}
        onCheckedChange={() => toggleSidebar()}
      >
        <PanelLeft /> File Explorer
        <DropdownMenuShortcut>
          {SHORTCUT_BY_ACTION["view.toggleSidebar"].keys}
        </DropdownMenuShortcut>
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={bottomPanelVisible}
        onCheckedChange={(v) => setBottomPanelVisible(Boolean(v))}
      >
        <PanelBottom /> Bottom Panel
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={showHiddenFiles}
        onCheckedChange={() => toggleShowHiddenFiles()}
      >
        <EyeOff /> Show Hidden Items
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={settings.showMinimap}
        onCheckedChange={(v) => updateSettings({ showMinimap: Boolean(v) })}
      >
        Minimap
        <DropdownMenuShortcut>
          {SHORTCUT_BY_ACTION["view.toggleMinimap"].keys}
        </DropdownMenuShortcut>
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={settings.wordWrap}
        onCheckedChange={(v) => updateSettings({ wordWrap: Boolean(v) })}
      >
        Word Wrap
        <DropdownMenuShortcut>
          {SHORTCUT_BY_ACTION["view.toggleWordWrap"].keys}
        </DropdownMenuShortcut>
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={settings.showLineNumbers}
        onCheckedChange={(v) => updateSettings({ showLineNumbers: Boolean(v) })}
      >
        Line Numbers
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={settings.renderWhitespace}
        onCheckedChange={(v) =>
          updateSettings({ renderWhitespace: Boolean(v) })
        }
      >
        Show Whitespace Characters
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={isSplitView}
        onCheckedChange={(v) => setSplitView(Boolean(v))}
      >
        <SplitSquareHorizontal /> Split Editor
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={markdownPreviewVisible && canPreviewMarkdown}
        disabled={!canPreviewMarkdown}
        onCheckedChange={() => toggleMarkdownPreview()}
      >
        <Columns2 /> Markdown Preview
      </DropdownMenuCheckboxItem>
      {tab && (
        <DropdownMenuCheckboxItem
          checked={tab.readOnly}
          onCheckedChange={(v) => setReadOnly(tab.id, Boolean(v))}
        >
          <Lock /> Read Only Mode
        </DropdownMenuCheckboxItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => runAction("view.zoomIn")}>
        <ZoomIn /> Zoom In
        <DropdownMenuShortcut>
          {SHORTCUT_BY_ACTION["view.zoomIn"].keys}
        </DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("view.zoomOut")}>
        <ZoomOut /> Zoom Out
        <DropdownMenuShortcut>
          {SHORTCUT_BY_ACTION["view.zoomOut"].keys}
        </DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("view.resetZoom")}>
        <RotateCcw /> Reset Zoom
        <DropdownMenuShortcut>
          {SHORTCUT_BY_ACTION["view.resetZoom"].keys}
        </DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => {
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen();
        }}
      >
        <Maximize /> Toggle Full Screen
      </DropdownMenuItem>
    </TopMenu>
  );
}
