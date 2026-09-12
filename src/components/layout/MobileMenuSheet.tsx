"use client";

import type { LucideIcon } from "lucide-react";
import {
  FilePlus,
  FolderOpen,
  Save,
  CalendarDays,
  Undo2,
  Redo2,
  Search,
  Replace,
  Braces,
  Eye,
  ZoomIn,
  ZoomOut,
  WrapText,
  PanelBottom,
  HardDriveDownload,
  FileDiff,
  Sparkles,
  FileCode,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileMenu } from "@/components/menu/FileMenu";
import { EditMenu } from "@/components/menu/EditMenu";
import { SearchMenu } from "@/components/menu/SearchMenu";
import { ViewMenu } from "@/components/menu/ViewMenu";
import { EncodingMenu } from "@/components/menu/EncodingMenu";
import { LanguageMenu } from "@/components/menu/LanguageMenu";
import { ToolsMenu } from "@/components/menu/ToolsMenu";
import { SettingsMenu } from "@/components/menu/SettingsMenu";
import { WindowMenu } from "@/components/menu/WindowMenu";
import { HelpMenu } from "@/components/menu/HelpMenu";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { SyncStatusBadge } from "@/components/auth/SyncStatusBadge";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { VoiceDictationButton } from "@/components/editor/VoiceDictationButton";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { openTodayDailyNote } from "@/services/dailyNotes";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/ui/AppLogo";

/** Menu triggers (FileMenu, EditMenu, ...) render their own compact desktop-style button —
 *  wrapping each in a bordered cell gives them a mobile-appropriate touch target without
 *  touching the shared component that the desktop menu bar also renders. */
function MenuGridCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border/70 bg-background/70 active:bg-accent rounded-xl border text-center shadow-xs transition-colors [&>button]:flex [&>button]:h-11 [&>button]:w-full [&>button]:items-center [&>button]:justify-center [&>button]:px-2 [&>button]:py-2.5">
      {children}
    </div>
  );
}

function ActionGridButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <SheetClose asChild>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center text-xs leading-tight font-medium shadow-xs transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]",
          active
            ? "border-primary/35 bg-primary/10 text-primary"
            : "border-border/70 bg-background/70 active:bg-accent active:text-accent-foreground",
        )}
      >
        <Icon className="size-5" />
        <span>{label}</span>
      </button>
    </SheetClose>
  );
}

/** Same look as ActionGridButton, but for actions that need a provider choice (AI features) —
 *  opens a small menu instead of firing immediately. Can't wrap the trigger in SheetClose like
 *  ActionGridButton does, since that would close the sheet before the menu could open; each item
 *  closes the sheet itself once a provider is actually chosen. */
function ActionGridMenuButton({
  icon: Icon,
  label,
  items,
  onCloseSheet,
}: {
  icon: LucideIcon;
  label: string;
  items: { label: string; onSelect: () => void }[];
  onCloseSheet: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="border-border/70 bg-background/70 active:bg-accent active:text-accent-foreground flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center text-xs leading-tight font-medium shadow-xs transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]"
        >
          <Icon className="size-5" />
          <span>{label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onSelect={() => {
              item.onSelect();
              onCloseSheet();
            }}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mobile's stand-in for the desktop MenuBar + Toolbar — same underlying menus and actions,
 *  laid out as touch-friendly grids in a bottom sheet instead of a horizontally-scrolling strip. */
export function MobileMenuSheet() {
  const open = useUIStore((s) => s.mobileMenuSheetOpen);
  const setOpen = useUIStore((s) => s.setMobileMenuSheetOpen);
  const bottomPanelVisible = useUIStore((s) => s.bottomPanelVisible);
  const setBottomPanelVisible = useUIStore((s) => s.setBottomPanelVisible);
  const markdownPreviewVisible = useUIStore((s) => s.markdownPreviewVisible);
  const toggleMarkdownPreview = useUIStore((s) => s.toggleMarkdownPreview);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const authStatus = useAuthStore((s) => s.status);

  const activeTabId = useTabsStore((s) => s.activeTabId);
  const activeFileId = useTabsStore(
    (s) => s.tabs.find((t) => t.id === activeTabId)?.fileId,
  );
  const activeNode = useWorkspaceStore((s) =>
    activeFileId ? s.nodes[activeFileId] : undefined,
  );
  const isMarkdownActive =
    activeNode?.type === "file" && activeNode.language === "markdown";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        className="np-scrollbar bg-popover/98 max-h-[92dvh] gap-0 overflow-y-auto rounded-t-3xl border-x p-0"
      >
        <SheetHeader className="bg-popover/95 sticky top-0 z-10 flex-row items-center gap-3 border-b p-4 backdrop-blur-xl">
          <AppLogo size="md" />
          <div>
            <SheetTitle>NextNotePad</SheetTitle>
            <p className="text-muted-foreground text-xs">
              Workspace menu and editor tools
            </p>
          </div>
        </SheetHeader>

        <div className="bg-muted/20 flex items-center justify-between gap-2 border-b p-4">
          <AccountMenu />
          <div className="flex shrink-0 items-center gap-2">
            <SyncStatusBadge />
            <InstallAppButton />
          </div>
        </div>
        {authStatus === "guest" && (
          <p className="bg-muted/20 text-muted-foreground flex items-center gap-1.5 border-b px-4 pb-3 text-xs">
            <HardDriveDownload className="size-3.5" />
            Guest Mode — stored locally
          </p>
        )}

        <div className="p-4">
          <p className="text-muted-foreground mb-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase">
            Menus
          </p>
          <div className="grid grid-cols-3 gap-2">
            <MenuGridCell>
              <FileMenu />
            </MenuGridCell>
            <MenuGridCell>
              <EditMenu />
            </MenuGridCell>
            <MenuGridCell>
              <SearchMenu />
            </MenuGridCell>
            <MenuGridCell>
              <ViewMenu />
            </MenuGridCell>
            <MenuGridCell>
              <EncodingMenu />
            </MenuGridCell>
            <MenuGridCell>
              <LanguageMenu />
            </MenuGridCell>
            <MenuGridCell>
              <ToolsMenu />
            </MenuGridCell>
            <MenuGridCell>
              <SettingsMenu />
            </MenuGridCell>
            <MenuGridCell>
              <WindowMenu />
            </MenuGridCell>
            <MenuGridCell>
              <HelpMenu />
            </MenuGridCell>
          </div>
        </div>

        <div className="border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <p className="text-muted-foreground mb-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase">
            Actions
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <ActionGridButton
              icon={FilePlus}
              label="New File"
              onClick={() => runAction("file.new")}
            />
            <ActionGridButton
              icon={FolderOpen}
              label="Open / Import"
              onClick={() => runAction("file.open")}
            />
            <ActionGridButton
              icon={Save}
              label="Save"
              onClick={() => runAction("file.save")}
            />
            <ActionGridButton
              icon={CalendarDays}
              label="Daily Note"
              onClick={() =>
                void openTodayDailyNote().catch(() =>
                  toast.error("Couldn't open today's daily note."),
                )
              }
            />
            <ActionGridButton
              icon={Undo2}
              label="Undo"
              onClick={() => runAction("edit.undo")}
            />
            <ActionGridButton
              icon={Redo2}
              label="Redo"
              onClick={() => runAction("edit.redo")}
            />
            <ActionGridButton
              icon={Search}
              label="Find"
              onClick={() => runAction("search.find")}
            />
            <ActionGridButton
              icon={Replace}
              label="Replace"
              onClick={() => runAction("search.replace")}
            />
            <ActionGridButton
              icon={Braces}
              label="Format"
              onClick={() => runAction("edit.formatDocument")}
            />
            <ActionGridButton
              icon={FileDiff}
              label="Diff Checker"
              onClick={() => runAction("tools.diffChecker")}
            />
            <ActionGridMenuButton
              icon={Sparkles}
              label="Fix Grammar (AI)"
              onCloseSheet={() => setOpen(false)}
              items={[
                {
                  label: "Gemini",
                  onSelect: () => runAction("tools.ai.fixGrammar.gemini"),
                },
                {
                  label: "Claude (via AgentRouter)",
                  onSelect: () => runAction("tools.ai.fixGrammar.claude"),
                },
              ]}
            />
            <ActionGridMenuButton
              icon={FileCode}
              label="Generate MD Syntax (AI)"
              onCloseSheet={() => setOpen(false)}
              items={[
                {
                  label: "Gemini",
                  onSelect: () => runAction("tools.ai.generateMdSyntax.gemini"),
                },
                {
                  label: "Claude (via AgentRouter)",
                  onSelect: () => runAction("tools.ai.generateMdSyntax.claude"),
                },
              ]}
            />
            <ActionGridMenuButton
              icon={Wand2}
              label="Generate Prompt (AI)"
              onCloseSheet={() => setOpen(false)}
              items={[
                {
                  label: "Gemini",
                  onSelect: () => runAction("tools.ai.generatePrompt.gemini"),
                },
                {
                  label: "Claude (via AgentRouter)",
                  onSelect: () => runAction("tools.ai.generatePrompt.claude"),
                },
              ]}
            />
            <ActionGridButton
              icon={Eye}
              label="Markdown Preview"
              active={markdownPreviewVisible && isMarkdownActive}
              onClick={() => {
                if (!isMarkdownActive) {
                  toast.error(
                    "Open a markdown (.md) file first to preview it.",
                  );
                  return;
                }
                toggleMarkdownPreview();
              }}
            />
            <ActionGridButton
              icon={ZoomOut}
              label="Zoom Out"
              onClick={() => runAction("view.zoomOut")}
            />
            <ActionGridButton
              icon={ZoomIn}
              label="Zoom In"
              onClick={() => runAction("view.zoomIn")}
            />
            <ActionGridButton
              icon={WrapText}
              label="Word Wrap"
              active={settings.wordWrap}
              onClick={() => updateSettings({ wordWrap: !settings.wordWrap })}
            />
            <ActionGridButton
              icon={PanelBottom}
              label="Bottom Panel"
              active={bottomPanelVisible}
              onClick={() => setBottomPanelVisible(!bottomPanelVisible)}
            />
            <div className="border-border/70 bg-background/70 flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center text-xs leading-tight font-medium shadow-xs">
              <VoiceDictationButton />
              <span>Voice Typing</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
