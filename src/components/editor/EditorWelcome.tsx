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
import { AppLogo } from "@/components/ui/AppLogo";

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
          className="min-w-5 rounded-md border border-border/80 bg-muted/70 px-2 py-0.5 text-center font-mono text-[11px] font-medium leading-4 text-muted-foreground shadow-2xs"
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
      className="group relative flex items-center gap-3.5 rounded-xl border border-border/60 bg-card/40 p-3.5 text-left text-xs transition-all duration-200 hover:border-primary/40 hover:bg-accent/40 hover:shadow-xs hover:scale-[1.01] active:scale-[0.99] focus-visible:ring-1.5 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
        {description && (
          <span className="block truncate text-[11px] text-muted-foreground/80 mt-0.5">{description}</span>
        )}
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
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
    <div className="np-scrollbar h-full overflow-auto px-6 py-12 select-none">
      <div className="animate-in fade-in mx-auto max-w-xl duration-200">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start">
          <div className="mb-3.5 flex items-center gap-3">
            <AppLogo size="lg" className="hover:scale-105 transition-transform shadow-md rounded-xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">NextNotePad</h1>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Fast & Local
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground/80">
                Modern developer notepad inspired by Notepad++. Offline-ready, zero install.
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <QuickAction
            icon={FilePlus}
            label="New File"
            description="Create an empty file (Ctrl+N)"
            onClick={() => runAction("file.new")}
          />
          <QuickAction
            icon={FolderOpen}
            label="Open / Import…"
            description="Open local files or folders (Ctrl+O)"
            onClick={() => runAction("file.open")}
          />
          <QuickAction
            icon={CalendarDays}
            label="Today's Daily Note"
            description="Open or create today's daily log"
            onClick={() =>
              void openTodayDailyNote().catch(() => toast.error("Couldn't open today's daily note."))
            }
          />
          <QuickAction
            icon={CommandIcon}
            label="Command Palette"
            description="Find commands and tools (Ctrl+Shift+P)"
            onClick={() => openDialog("commandPalette")}
          />
        </div>

        {/* Recent files */}
        {recentFiles.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <Clock className="size-3.5 text-primary" />
              Recent Files
            </h2>
            <ul className="overflow-hidden rounded-xl border border-border/60 bg-card/40 divide-y divide-border/40 shadow-2xs">
              {recentFiles.map((node) => {
                const Icon = getFileIcon(node.name);
                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => openFileForUser(node.id)}
                      className="group flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-accent/60 focus-visible:ring-1.5 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <Icon className="size-3.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                      <span className="truncate font-medium text-foreground group-hover:text-primary transition-colors">{node.name}</span>
                      <span className="ml-auto hidden truncate text-[11px] text-muted-foreground/60 sm:block">
                        {node.path}
                      </span>
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Shortcuts */}
        <section>
          <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Keyboard Shortcuts
          </h2>
          <ul className="overflow-hidden rounded-xl border border-border/60 bg-card/40 divide-y divide-border/40 shadow-2xs">
            {shortcuts.map((s) => (
              <li
                key={s.action}
                className="flex items-center justify-between gap-4 px-3.5 py-2 text-xs transition-colors hover:bg-accent/40"
              >
                <span className="truncate text-muted-foreground/90">{s.label}</span>
                <Kbd combo={s.keys} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
