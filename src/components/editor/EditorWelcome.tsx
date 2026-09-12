"use client";

import {
  FilePlus,
  FolderOpen,
  CalendarDays,
  Command as CommandIcon,
  Clock,
  ChevronRight,
} from "lucide-react";
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
          className="border-border/80 bg-muted/70 text-muted-foreground min-w-5 rounded-md border px-2 py-0.5 text-center font-mono text-[11px] leading-4 font-medium shadow-2xs"
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
      className="group border-border/70 bg-card/75 hover:border-primary/30 hover:bg-card focus-visible:ring-ring/30 relative flex items-center gap-3.5 rounded-xl border p-4 text-left text-[13px] shadow-xs transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none active:translate-y-0 active:scale-[0.98]"
    >
      <span className="bg-primary/10 text-primary ring-primary/15 group-hover:bg-primary group-hover:text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-all duration-200">
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground group-hover:text-primary block truncate font-medium transition-colors">
          {label}
        </span>
        {description && (
          <span className="text-muted-foreground/80 mt-0.5 block truncate text-xs">
            {description}
          </span>
        )}
      </span>
      <ChevronRight className="text-muted-foreground/40 size-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
    </button>
  );
}

/** Shown when no file is open. Replaces a bare "No file open" line with something that actually
 *  gets you moving: quick actions, the keyboard shortcuts worth knowing, and your recent files. */
export function EditorWelcome() {
  const recent = useRecentFilesStore((s) => s.recent);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const openDialog = useDialogStore((s) => s.openDialog);

  const shortcuts = FEATURED_ACTIONS.map((id) =>
    SHORTCUTS.find((s) => s.action === id),
  ).filter((s): s is (typeof SHORTCUTS)[number] => Boolean(s));

  // Recents can outlive the files they point at (deleted, or a stale guest-mode id after signing
  // in), so resolve against the live tree and drop anything that no longer exists.
  const recentFiles = recent
    .map((entry) => nodes[entry.fileId])
    .filter((node) => node?.type === "file")
    .slice(0, 5);

  return (
    <div className="np-scrollbar relative h-full overflow-auto bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_35rem)] px-4 py-8 select-none sm:px-8 sm:py-12">
      <div className="animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-3xl duration-300">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start">
          <div className="mb-4 flex items-center gap-4">
            <AppLogo
              size="xl"
              className="shadow-primary/10 rounded-2xl shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.025em]">
                  NextNotePad
                </h1>
                <span className="border-primary/20 bg-primary/10 text-primary rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase">
                  Offline ready
                </span>
              </div>
              <p className="text-muted-foreground mt-1 max-w-lg text-sm leading-relaxed">
                A focused workspace for notes, code, Markdown, and everyday text
                tools.
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              void openTodayDailyNote().catch(() =>
                toast.error("Couldn't open today's daily note."),
              )
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
        <div className="grid gap-6 lg:grid-cols-2">
          {recentFiles.length > 0 && (
            <section>
              <h2 className="text-muted-foreground/70 mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
                <Clock className="text-primary size-3.5" />
                Recent Files
              </h2>
              <ul className="divide-border/50 border-border/70 bg-card/70 divide-y overflow-hidden rounded-xl border shadow-xs">
                {recentFiles.map((node) => {
                  const Icon = getFileIcon(node.name);
                  return (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => openFileForUser(node.id)}
                        className="group hover:bg-accent/60 focus-visible:ring-1.5 focus-visible:ring-ring flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs transition-colors focus-visible:outline-none"
                      >
                        <Icon className="size-3.5 shrink-0 opacity-80 transition-opacity group-hover:opacity-100" />
                        <span className="text-foreground group-hover:text-primary truncate font-medium transition-colors">
                          {node.name}
                        </span>
                        <span className="text-muted-foreground/60 ml-auto hidden truncate text-[11px] sm:block">
                          {node.path}
                        </span>
                        <ChevronRight className="text-muted-foreground/40 size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Shortcuts */}
          <section className={recentFiles.length > 0 ? "" : "lg:col-span-2"}>
            <h2 className="text-muted-foreground/70 mb-2.5 text-[11px] font-semibold tracking-wider uppercase">
              Keyboard Shortcuts
            </h2>
            <ul className="divide-border/50 border-border/70 bg-card/70 divide-y overflow-hidden rounded-xl border shadow-xs">
              {shortcuts.map((s) => (
                <li
                  key={s.action}
                  className="hover:bg-accent/40 flex items-center justify-between gap-4 px-3.5 py-2 text-xs transition-colors"
                >
                  <span className="text-muted-foreground/90 truncate">
                    {s.label}
                  </span>
                  <Kbd combo={s.keys} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
