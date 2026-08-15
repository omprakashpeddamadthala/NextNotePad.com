"use client";

import { FilePlus, FolderOpen, CalendarDays, Command as CommandIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { getFileIcon } from "@/lib/fileIcons";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { openTodayDailyNote } from "@/services/dailyNotes";
import { SHORTCUTS } from "@/lib/constants/shortcuts";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUIStore } from "@/store/uiStore";
import { openFileForUser } from "@/services/openFile";

/** Shortcuts worth surfacing on an empty editor — the ones that get someone productive fastest,
 *  pulled from the same SHORTCUTS table the settings dialog and command palette use so the keys
 *  shown here can never drift from the keys that actually work. */
const FEATURED_ACTIONS = [
  "file.new",
  "search.quickOpen",
  "view.commandPalette",
  "search.findInFiles",
  "file.save",
  "edit.formatDocument",
] as const;

function Kbd({ combo }: { combo: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {combo.split("+").map((key) => (
        <kbd
          key={key}
          className="min-w-5 rounded-sm border border-b-2 bg-muted px-1.5 py-0.5 text-center font-mono text-[10px] leading-4 text-muted-foreground"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof FilePlus;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-sm border bg-background px-3 py-2 text-left text-[13px] transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {label}
    </button>
  );
}

/** Shown when no file is open. Replaces a bare "No file open" line with something that actually
 *  gets you moving: quick actions, the keyboard shortcuts worth knowing, and your recent files. */
export function EditorWelcome() {
  const recent = useRecentFilesStore((s) => s.recent);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  const shortcuts = FEATURED_ACTIONS.map((id) => SHORTCUTS.find((s) => s.action === id)).filter(
    (s): s is (typeof SHORTCUTS)[number] => Boolean(s),
  );

  // Recents can outlive the files they point at (deleted, or a stale guest-mode id after signing
  // in), so resolve against the live tree and drop anything that no longer exists.
  const recentFiles = recent
    .map((entry) => nodes[entry.fileId])
    .filter((node) => node?.type === "file")
    .slice(0, 5);

  return (
    <div className="np-scrollbar h-full overflow-auto px-6 py-8">
      <div className="animate-in fade-in mx-auto max-w-2xl duration-200">
        <h1 className="font-heading text-lg font-medium">NextNotePad.com</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A Notepad++-style editor in your browser. Nothing to install.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <QuickAction icon={FilePlus} label="New File" onClick={() => runAction("file.new")} />
          <QuickAction icon={FolderOpen} label="Open / Import…" onClick={() => runAction("file.open")} />
          <QuickAction
            icon={CalendarDays}
            label="Today's Daily Note"
            onClick={() =>
              void openTodayDailyNote().catch(() => toast.error("Couldn't open today's daily note."))
            }
          />
          <QuickAction
            icon={CommandIcon}
            label="Command Palette"
            onClick={() => setCommandPaletteOpen(true)}
          />
        </div>

        {recentFiles.length > 0 && (
          <section className="mt-8">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Clock className="size-3.5" /> Recent
            </h2>
            <ul className="mt-2 space-y-0.5">
              {recentFiles.map((node) => {
                const Icon = getFileIcon(node.name);
                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => openFileForUser(node.id)}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{node.name}</span>
                      <span className="ml-auto hidden truncate text-xs text-muted-foreground sm:block">
                        {node.path}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Shortcuts</h2>
          <ul className="mt-2 divide-y rounded-sm border">
            {shortcuts.map((s) => (
              <li key={s.action} className="flex items-center justify-between gap-4 px-3 py-2 text-[13px]">
                <span className="truncate">{s.label}</span>
                <Kbd combo={s.keys} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
