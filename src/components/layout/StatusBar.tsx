"use client";

import { useEditorStatusStore } from "@/store/editorStatusStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
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
  const stats = countNodes(nodes);

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
