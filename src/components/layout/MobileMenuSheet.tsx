"use client";

import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  Command,
  CopyPlus,
  FileLock2,
  FileX2,
  HardDriveDownload,
  Info,
  Layers,
  Lock,
  PencilLine,
  Replace,
  Settings2,
  Trash2,
  BarChart3,
  ArrowDownUp,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FileMenu } from "@/components/menu/FileMenu";
import { EditMenu } from "@/components/menu/EditMenu";
import { SearchMenu } from "@/components/menu/SearchMenu";
import { ViewMenu } from "@/components/menu/ViewMenu";
import { EncodingMenu } from "@/components/menu/EncodingMenu";
import { LanguageMenu } from "@/components/menu/LanguageMenu";
import { ToolsMenu } from "@/components/menu/ToolsMenu";
import { WindowMenu } from "@/components/menu/WindowMenu";
import { HelpMenu } from "@/components/menu/HelpMenu";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { SyncStatusBadge } from "@/components/auth/SyncStatusBadge";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useDialogStore } from "@/store/dialogStore";
import { useLockStore } from "@/store/lockStore";
import { useLockDialogStore } from "@/store/lockDialogStore";
import { useExplorerSelectionStore } from "@/store/explorerSelectionStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import { runAction } from "@/services/shortcuts/actionRegistry";

interface MenuRowProps {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onClick: () => void;
}

function MenuRow({ icon: Icon, label, hint, onClick }: MenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="active:bg-accent/70 flex min-h-12 w-full items-center gap-3.5 px-4 py-2.5 text-left transition-colors duration-150"
    >
      <span className="bg-muted text-foreground/80 flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground block truncate text-[14px] font-medium">
          {label}
        </span>
        {hint && (
          <span className="text-muted-foreground block truncate text-xs">
            {hint}
          </span>
        )}
      </span>
      <ChevronRight className="text-muted-foreground/50 size-4 shrink-0" />
    </button>
  );
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="text-muted-foreground mb-1.5 px-1 text-[11px] font-semibold tracking-[0.1em] uppercase">
        {title}
      </h3>
      <div className="border-border/70 bg-background/70 divide-border/60 divide-y overflow-hidden rounded-2xl border">
        {children}
      </div>
    </section>
  );
}

export function MobileMenuSheet() {
  const open = useUIStore((s) => s.mobileMenuSheetOpen);
  const setOpen = useUIStore((s) => s.setMobileMenuSheetOpen);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const setMobileWorkspaceSheetOpen = useUIStore(
    (s) => s.setMobileWorkspaceSheetOpen,
  );
  const setExplorerShowTrash = useUIStore((s) => s.setExplorerShowTrash);
  const authStatus = useAuthStore((s) => s.status);
  const openDialog = useDialogStore((s) => s.openDialog);
  const { file, tab } = useActiveFile();

  /** Close the sheet first so the next screen isn't hidden behind it. */
  function run(action: () => void) {
    setOpen(false);
    action();
  }

  function renameActiveNote() {
    if (!file) return;
    const selection = useExplorerSelectionStore.getState();
    selection.setSelectedNodeId(file.id);
    selection.setRenamingNodeId(file.id);
    setMobileSidebarOpen(true);
  }

  function toggleNoteLock() {
    if (!file) return;
    const lockDialog = useLockDialogStore.getState();
    if (file.locked) lockDialog.openUnlockDialog(file.id);
    else lockDialog.openLockDialog(file.id);
  }

  function lockApp() {
    const lockStore = useLockStore.getState();
    if (lockStore.enabled) void lockStore.lock();
    else openDialog("settings");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="np-scrollbar bg-popover max-h-[92dvh] gap-0 overflow-y-auto rounded-t-3xl border-x p-0"
      >
        <SheetHeader className="bg-popover/95 sticky top-0 z-10 gap-0 border-b px-4 pt-2.5 pb-3 backdrop-blur-xl">
          <div className="bg-muted-foreground/25 mx-auto mb-3 h-1 w-10 rounded-full" />
          <SheetTitle className="sr-only">More options</SheetTitle>
          <div className="flex items-center justify-between gap-2 pr-8">
            <AccountMenu />
            <div className="flex items-center gap-1.5">
              <SyncStatusBadge />
              <InstallAppButton />
            </div>
          </div>
          {authStatus === "guest" && (
            <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
              <HardDriveDownload className="size-3.5" />
              Guest Mode — notes are saved on this device
            </p>
          )}
        </SheetHeader>

        <div className="px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {file && tab && (
            <MenuGroup title="This note">
              <MenuRow
                icon={PencilLine}
                label="Rename"
                hint={file.name}
                onClick={() => run(renameActiveNote)}
              />
              <MenuRow
                icon={Replace}
                label="Find & replace"
                onClick={() => run(() => runAction("search.replace"))}
              />
              <MenuRow
                icon={CopyPlus}
                label="Duplicate"
                onClick={() => run(() => runAction("file.saveAs"))}
              />
              <MenuRow
                icon={FileLock2}
                label={file.locked ? "Unlock note" : "Lock note"}
                hint={file.locked ? undefined : "Protect with a password"}
                onClick={() => run(toggleNoteLock)}
              />
              <MenuRow
                icon={FileX2}
                label="Close note"
                onClick={() =>
                  run(() => runAction("file.closeTab"))
                }
              />
            </MenuGroup>
          )}

          <MenuGroup title="Workspace">
            <MenuRow
              icon={Layers}
              label="Switch workspace"
              onClick={() => run(() => setMobileWorkspaceSheetOpen(true))}
            />
            <MenuRow
              icon={Trash2}
              label="Recycle bin"
              onClick={() =>
                run(() => {
                  setExplorerShowTrash(true);
                  setMobileSidebarOpen(true);
                })
              }
            />
            <MenuRow
              icon={ArrowDownUp}
              label="Export / import"
              hint="Back up or restore as a zip file"
              onClick={() => run(() => openDialog("exportImport"))}
            />
            <MenuRow
              icon={BarChart3}
              label="Workspace stats"
              onClick={() => run(() => openDialog("workspaceStats"))}
            />
          </MenuGroup>

          <MenuGroup title="App">
            <MenuRow
              icon={Settings2}
              label="Settings"
              onClick={() => run(() => openDialog("settings"))}
            />
            <MenuRow
              icon={Command}
              label="All commands"
              hint="Search every action and tool"
              onClick={() => run(() => openDialog("commandPalette"))}
            />
            <MenuRow icon={Lock} label="Lock app" onClick={() => run(lockApp)} />
            <MenuRow
              icon={Info}
              label="About"
              onClick={() => run(() => openDialog("about"))}
            />
          </MenuGroup>

          <section className="mt-5">
            <h3 className="text-muted-foreground mb-1.5 px-1 text-[11px] font-semibold tracking-[0.1em] uppercase">
              Classic menus
            </h3>
            <div className="flex flex-wrap gap-1.5 [&>button]:border-border/70 [&>button]:bg-background/70 [&>button]:h-9 [&>button]:rounded-full [&>button]:border [&>button]:px-3.5 [&>button]:text-[13px]">
              <FileMenu />
              <EditMenu />
              <SearchMenu />
              <ViewMenu />
              <EncodingMenu />
              <LanguageMenu />
              <ToolsMenu />
              <WindowMenu />
              <HelpMenu />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
