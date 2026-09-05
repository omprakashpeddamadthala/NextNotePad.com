"use client";

import { FilePlus, FolderOpen, CalendarDays, Command as CommandIcon, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getFileIcon } from "@/lib/fileIcons";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { openTodayDailyNote } from "@/services/dailyNotes";
import { SHORTCUTS } from "@/lib/constants/shortcuts";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useDialogStore } from "@/store/dialogStore";
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
          className="min-w-5 rounded border border-b-2 bg-muted/60 px-1.5 py-0.5 text-center font-mono text-[11px] leading-4 text-muted-foreground"
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
  description,
  onClick,
}: {
  icon: typeof FilePlus;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-md border bg-background/60 px-3 py-2.5 text-left text-xs transition-all hover:border-primary/40 hover:bg-accent hover:shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{label}</span>
        {description && (
          <span className="block truncate text-[11px] text-muted-foreground">{description}</span>
        )}
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/** Shown when no file is open. Replaces a bare "No file open" line with something that actually
 *  gets you moving: quick actions, the keyboard shortcuts worth knowing, and your recent files. */
export function EditorWelcome() {
  const recent = useRecentFilesStore((s) => s.recent);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const openDialog = useDialogStore((s) => s.openDialog);

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
    <div className="np-scrollbar h-full overflow-auto px-8 py-10">
      <div className="animate-in fade-in mx-auto max-w-xl duration-200">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <span className="text-sm font-bold text-primary">N</span>
          </div>
          <h1 className="font-heading text-base font-semibold tracking-tight">NextNotePad</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            A Notepad++-style editor in your browser. Nothing to install.
          </p>
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <QuickAction
            icon={FilePlus}
            label="New File"
            description="Ctrl+N"
            onClick={() => runAction("file.new")}
          />
          <QuickAction
            icon={FolderOpen}
            label="Open / Import…"
            description="Ctrl+O"
            onClick={() => runAction("file.open")}
          />
          <QuickAction
            icon={CalendarDays}
            label="Today's Daily Note"
            description="Open or create today's note"
            onClick={() =>
              void openTodayDailyNote().catch(() => toast.error("Couldn't open today's daily note."))
            }
          />
          <QuickAction
            icon={CommandIcon}
            label="Command Palette"
            description="Ctrl+Shift+P"
            onClick={() => openDialog("commandPalette")}
          />
        </div>

        {/* Recent files */}
        {recentFiles.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Clock className="size-3" />
              Recent
            </h2>
            <ul className="overflow-hidden rounded-md border">
              {recentFiles.map((node) => {
                const Icon = getFileIcon(node.name);
                return (
                  <li key={node.id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => openFileForUser(node.id)}
                      className="group flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    >
                    <Icon className="size-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="truncate font-medium">{node.name}</span>
                      <span className="ml-auto hidden truncate text-[11px] text-muted-foreground/50 sm:block">
                        {node.path}
                      </span>
                      <ChevronRight className="size-3 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Shortcuts */}
        <section>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Shortcuts
          </h2>
          <ul className="overflow-hidden rounded-md border divide-y">
            {shortcuts.map((s) => (
              <li
                key={s.action}
                className="flex items-center justify-between gap-4 px-3 py-2 text-xs transition-colors hover:bg-accent/50"
              >
                <span className="truncate text-muted-foreground">{s.label}</span>
                <Kbd combo={s.keys} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
