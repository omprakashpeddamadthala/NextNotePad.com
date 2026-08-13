"use client";

import { useEditorStatusStore } from "@/store/editorStatusStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { countNodes } from "@/lib/utils/treeUtils";

function Segment({ children }: { children: React.ReactNode }) {
  return <span className="flex h-full items-center border-l border-black/10 px-2.5">{children}</span>;
}

export function StatusBar() {
  const { line, column, selectionLength, totalLines, insertMode, eol } = useEditorStatusStore();
  const zoomLevel = useSettingsStore((s) => s.settings.zoomLevel);
  const { file } = useActiveFile();
  const nodes = useWorkspaceStore((s) => s.nodes);
  const setWorkspaceStatsOpen = useUIStore((s) => s.setWorkspaceStatsOpen);
  const isMobile = useIsMobile();
  const stats = countNodes(nodes);

  // The full set of segments below assumes desktop's width — crammed onto a phone screen they'd
  // overlap and become illegible, so mobile only keeps the two most useful at a glance.
  if (isMobile) {
    return (
      <div
        role="status"
        aria-label="Status bar"
        className="flex h-[22px] shrink-0 items-center justify-between bg-[var(--np-statusbar-bg)] text-xs text-[var(--np-statusbar-fg)] select-none"
      >
        <button
          type="button"
          onClick={() => setWorkspaceStatsOpen(true)}
          className="truncate px-2.5"
          title="Workspace statistics"
        >
          {stats.files} file{stats.files === 1 ? "" : "s"}, {stats.folders} folder{stats.folders === 1 ? "" : "s"}
        </button>
        {file && (
          <span className="shrink-0 truncate px-2.5">
            Ln {line} : Col {column}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Status bar"
      className="flex h-[22px] shrink-0 items-center bg-[var(--np-statusbar-bg)] text-xs text-[var(--np-statusbar-fg)] select-none"
    >
      <button
        type="button"
        onClick={() => setWorkspaceStatsOpen(true)}
        className="px-2.5 hover:underline"
        title="Workspace statistics"
      >
        {stats.files} file{stats.files === 1 ? "" : "s"}, {stats.folders} folder{stats.folders === 1 ? "" : "s"}
      </button>
      <div className="flex h-full flex-1 items-center justify-end">
        {file && (
          <>
            <Segment>
              Ln {line} : Col {column}
              {selectionLength > 0 ? ` : Sel ${selectionLength}` : ""}
            </Segment>
            <Segment>{totalLines} lines</Segment>
            <Segment>{eol === "CRLF" ? "Windows (CR LF)" : "Unix (LF)"}</Segment>
            <Segment>{file.encoding}</Segment>
            <Segment>
              <span className="capitalize">{file.language}</span>
            </Segment>
            <Segment>{insertMode ? "INS" : "OVR"}</Segment>
          </>
        )}
        <Segment>Zoom {zoomLevel >= 0 ? `+${zoomLevel}` : zoomLevel}</Segment>
      </div>
    </div>
  );
}
