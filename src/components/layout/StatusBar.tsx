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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`flex h-full items-center border-l px-3 font-mono text-[11px] font-medium tabular-nums transition-colors hover:bg-white/10 ${className ?? ""}`}
      style={{ borderColor: "rgba(255,255,255,0.12)" }}
    >
      {children}
    </span>
  );
}

/** Mirrors the top progress bar in words — the bar alone is easy to miss at 2px tall, and this
 *  sits right where the eye already goes for file state. Shares the same delayed `visible` flag,
 *  so quick calls don't make it flicker. */
function ApiActivitySegment() {
  const visible = useApiActivityStore((s) => s.visible);
  if (!visible) return null;
  return (
    <Segment className="bg-primary/20 font-medium text-white">
      <span className="flex items-center gap-1.5">
        <Loader2 className="text-primary-foreground size-3 animate-spin" />
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

  // The full set of segments below assumes desktop's width — crammed onto a phone screen they'd
  // overlap and become illegible, so mobile only keeps the two most useful at a glance.
  if (isMobile) {
    return (
      <div
        role="status"
        aria-label="Status bar"
        className="flex min-h-7 shrink-0 items-center justify-between border-t border-white/10 bg-[var(--np-statusbar-bg)] pb-[env(safe-area-inset-bottom)] text-[11px] text-[var(--np-statusbar-fg)] select-none"
      >
        <button
          type="button"
          onClick={() => openDialog("workspaceStats")}
          className="focus-visible:ring-ring truncate px-2.5 text-[11px] font-medium transition-colors hover:bg-white/10 focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset active:bg-white/15"
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
      className="flex h-7 shrink-0 items-center border-t border-white/10 bg-[var(--np-statusbar-bg)] text-[11px] text-[var(--np-statusbar-fg)] shadow-[0_-8px_20px_-18px_rgba(15,23,42,0.8)] select-none"
    >
      <button
        type="button"
        onClick={() => openDialog("workspaceStats")}
        className="focus-visible:ring-ring flex h-full items-center px-3 [font-feature-settings:'tnum'] text-[11px] font-semibold tabular-nums opacity-90 transition-colors hover:bg-white/10 focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset"
        title="Workspace statistics"
      >
        {stats.files} file{stats.files === 1 ? "" : "s"}, {stats.folders} folder
        {stats.folders === 1 ? "" : "s"}
      </button>
      <div className="flex h-full flex-1 items-center justify-end">
        <ApiActivitySegment />
        {file && (
          <>
            <Segment>
              Ln {line}, Col {column}
              {selectionLength > 0 ? ` (${selectionLength} selected)` : ""}
            </Segment>
            <Segment>{totalLines} lines</Segment>
            <Segment>{eol === "CRLF" ? "CRLF" : "LF"}</Segment>
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
