"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Copy, FolderTree, Plus, Search } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useDialogStore } from "@/store/dialogStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import { useNewNodeTargetParentId } from "@/hooks/useNewNodeTargetParentId";
import { createFile, nextUntitledName } from "@/services/fileOperations";
import { copyNote } from "@/services/copyNote";
import { cn } from "@/lib/utils";

interface BarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  /** Runs instead of onClick when the button is held for half a second. */
  onLongPress?: () => void;
  disabled?: boolean;
  primary?: boolean;
}

const LONG_PRESS_MS = 500;

function BarButton({ icon: Icon, label, onClick, onLongPress, disabled, primary }: BarButtonProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  function cancelPress() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (longPressed.current) {
          longPressed.current = false;
          return;
        }
        onClick();
      }}
      onPointerDown={
        onLongPress
          ? () => {
              longPressed.current = false;
              cancelPress();
              timer.current = setTimeout(() => {
                longPressed.current = true;
                navigator.vibrate?.(10);
                onLongPress();
              }, LONG_PRESS_MS);
            }
          : undefined
      }
      onPointerUp={onLongPress ? cancelPress : undefined}
      onPointerLeave={onLongPress ? cancelPress : undefined}
      onPointerCancel={onLongPress ? cancelPress : undefined}
      onContextMenu={onLongPress ? (e) => e.preventDefault() : undefined}
      title={onLongPress ? "Hold for templates" : undefined}
      disabled={disabled}
      className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-opacity duration-150 disabled:opacity-40"
    >
      <span
        className={cn(
          "flex h-8 w-12 items-center justify-center rounded-full transition-[background-color,transform] duration-150 group-active:scale-[0.92]",
          primary
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground group-active:bg-accent",
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className={primary ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </button>
  );
}

export function MobileBottomBar() {
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const openDialog = useDialogStore((s) => s.openDialog);
  const { file } = useActiveFile();
  const parentId = useNewNodeTargetParentId();

  // Unlike the desktop "New File", this skips the inline rename: the explorer is hidden on phones.
  async function createNote() {
    const name = nextUntitledName(useWorkspaceStore.getState().nodes, parentId);
    const id = await createFile(parentId, name, "");
    useTabsStore.getState().openTab(id);
  }

  return (
    <nav
      aria-label="Quick actions"
      className="glass-surface relative z-20 flex shrink-0 items-stretch border-t px-2 pb-[env(safe-area-inset-bottom)]"
    >
      <BarButton
        icon={FolderTree}
        label="Files"
        onClick={() => setMobileSidebarOpen(true)}
      />
      <BarButton
        icon={Search}
        label="Search"
        onClick={() => openDialog("quickOpen")}
      />
      <BarButton
        icon={Plus}
        label="New note"
        primary
        onClick={() => void createNote()}
        onLongPress={() => openDialog("templates")}
      />
      <BarButton
        icon={Copy}
        label="Copy all"
        disabled={!file || file.locked}
        onClick={() => file && void copyNote(file.id)}
      />
    </nav>
  );
}
