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

/** Menu triggers (FileMenu, EditMenu, ...) render their own compact desktop-style button —
 *  wrapping each in a bordered cell gives them a mobile-appropriate touch target without
 *  touching the shared component that the desktop menu bar also renders. */
function MenuGridCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 active:bg-accent rounded-md border text-center transition-colors [&>button]:flex [&>button]:h-full [&>button]:w-full [&>button]:items-center [&>button]:justify-center [&>button]:py-2.5">
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
          "flex flex-col items-center gap-1 rounded-md border p-2.5 text-center text-xs leading-tight transition-colors",
          active
            ? "border-primary bg-accent text-accent-foreground"
            : "bg-muted/40 active:bg-accent active:text-accent-foreground",
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
          className="bg-muted/40 active:bg-accent active:text-accent-foreground flex flex-col items-center gap-1 rounded-md border p-2.5 text-center text-xs leading-tight transition-colors"
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
        className="max-h-[85vh] overflow-y-auto rounded-t-lg"
      >
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="flex items-center justify-between gap-2 border-b px-4 pb-4">
          <AccountMenu />
          <div className="flex shrink-0 items-center gap-2">
            <SyncStatusBadge />
            <InstallAppButton />
          </div>
        </div>
        {authStatus === "guest" && (
          <p className="text-muted-foreground -mt-2 flex items-center gap-1.5 px-4 pb-2 text-xs">
            <HardDriveDownload className="size-3.5" />
            Guest Mode — stored locally
          </p>
        )}

        <div className="px-4">
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
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

        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Actions
          </p>
          <div className="grid grid-cols-3 gap-2">
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
            <div className="bg-muted/40 flex flex-col items-center gap-1 rounded-md border p-2.5 text-center text-xs leading-tight">
              <VoiceDictationButton />
              <span>Voice Typing</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
