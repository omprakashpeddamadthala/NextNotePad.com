"use client";

import { Loader2 } from "lucide-react";
import { useEditorStatusStore } from "@/store/editorStatusStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useDialogStore } from "@/store/dialogStore";
import { useApiActivityStore } from "@/store/apiActivityStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { countNodes } from "@/lib/utils/treeUtils";

function Segment({
  children,
  className,
  onClick,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      title={title}
      onClick={onClick}
      className={`flex h-full items-center border-l border-white/8 px-2.5 font-mono text-[11px] tabular-nums transition-colors ${
        onClick ? "cursor-pointer hover:bg-white/8 active:bg-white/12 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/25" : ""
      } ${className ?? ""}`}
    >
      {children}
    </Tag>
  );
}

function ApiActivitySegment() {
  const visible = useApiActivityStore((s) => s.visible);
  if (!visible) return null;
  return (
    <Segment className="bg-primary/30 text-white font-medium">
      <span className="flex items-center gap-1.5">
        <Loader2 className="size-3 animate-spin opacity-90" />
        Syncing…
      </span>
    </Segment>
  );
}

export function StatusBar() {
  const { line, column, selectionLength, totalLines, insertMode, eol } =
    useEditorStatusStore();
  const zoomLevel = useSettingsStore((s) => s.settings.zoomLevel);
  const { file } = useActiveFile();
  const nodes = useWorkspaceStore((s) => s.nodes);
  const openDialog = useDialogStore((s) => s.openDialog);
  const isMobile = useIsMobile();
  const stats = countNodes(nodes);

  if (isMobile) {
    return (
      <div
        role="status"
        aria-label="Status bar"
      className="np-statusbar-gradient flex min-h-6 shrink-0 items-center justify-between border-t border-white/8 pb-[env(safe-area-inset-bottom)] text-[11px] text-[var(--np-statusbar-fg)] select-none"
      >
        <button
          type="button"
          onClick={() => openDialog("workspaceStats")}
          className="truncate px-2.5 text-[11px] font-medium transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30 active:bg-white/15"
          title="Workspace statistics"
        >
          {stats.files} file{stats.files === 1 ? "" : "s"}, {stats.folders}{" "}
          folder{stats.folders === 1 ? "" : "s"}
        </button>
        {file && (
          <span className="shrink-0 truncate px-2.5 font-mono">
            Ln {line}, Col {column}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Status bar"
      className="np-statusbar-gradient flex h-6.5 shrink-0 items-center border-t border-white/8 text-[11px] text-[var(--np-statusbar-fg)] select-none"
    >
      {/* Left side: workspace stats */}
      <Segment
        onClick={() => openDialog("workspaceStats")}
        title="Workspace statistics"
        className="font-semibold border-l-0"
      >
        {stats.files} file{stats.files === 1 ? "" : "s"},{" "}
        {stats.folders} folder{stats.folders === 1 ? "" : "s"}
      </Segment>

      {/* Right side: file-specific info */}
      <div className="flex h-full flex-1 items-center justify-end">
        <ApiActivitySegment />
        {file && (
          <>
            <Segment title="Cursor position">
              Ln {line}, Col {column}
              {selectionLength > 0 ? ` (${selectionLength} sel)` : ""}
            </Segment>
            <Segment title="Total lines">{totalLines} lines</Segment>
            <Segment title="Line ending">{eol === "CRLF" ? "CRLF" : "LF"}</Segment>
            <Segment title="File encoding">{file.encoding}</Segment>
            <Segment title="Language">
              <span className="capitalize">{file.language}</span>
            </Segment>
            <Segment title="Insert/Overwrite mode">
              {insertMode ? "INS" : "OVR"}
            </Segment>
          </>
        )}
        <Segment title="Zoom level">
          Zoom {zoomLevel >= 0 ? `+${zoomLevel}` : zoomLevel}
        </Segment>
      </div>
    </div>
  );
}
