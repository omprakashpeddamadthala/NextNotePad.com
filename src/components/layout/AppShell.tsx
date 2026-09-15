"use client";

import dynamic from "next/dynamic";

import { MenuBar } from "./MenuBar";
import { MobileAppBar } from "./MobileAppBar";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { StatusBar } from "./StatusBar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUIStore } from "@/store/uiStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  IconNavRail,
  CollectionsSidebar,
} from "@/components/layout/PostmanSidebar";
import { ToolsNavRail } from "@/components/layout/ToolsNavRail";
import { FileExplorer } from "@/components/explorer/FileExplorer";
import { EditorArea } from "@/components/editor/EditorArea";
import { BottomPanel } from "@/components/panels/BottomPanel";
import { useAppBootstrap } from "@/hooks/useAppBootstrap";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { GlobalActionsRegistrar } from "./GlobalActionsRegistrar";
import { ApiLoadingBar } from "./ApiLoadingBar";
import { CenterApiLoader } from "./CenterApiLoader";

// Lazy-loaded dialogs — none of these render anything visible until opened
const SettingsDialog = dynamic(
  () =>
    import("@/components/settings/SettingsDialog").then(
      (m) => m.SettingsDialog,
    ),
  {
    ssr: false,
  },
);
const QuickOpenDialog = dynamic(
  () =>
    import("@/components/search/QuickOpenDialog").then(
      (m) => m.QuickOpenDialog,
    ),
  {
    ssr: false,
  },
);
const CommandPalette = dynamic(
  () =>
    import("@/components/search/CommandPalette").then((m) => m.CommandPalette),
  {
    ssr: false,
  },
);
const AboutDialog = dynamic(
  () => import("@/components/dialogs/AboutDialog").then((m) => m.AboutDialog),
  {
    ssr: false,
  },
);
const ExportImportDialog = dynamic(
  () =>
    import("@/components/dialogs/ExportImportDialog").then(
      (m) => m.ExportImportDialog,
    ),
  { ssr: false },
);
const WorkspaceStatsDialog = dynamic(
  () =>
    import("@/components/dialogs/WorkspaceStatsDialog").then(
      (m) => m.WorkspaceStatsDialog,
    ),
  { ssr: false },
);
const LockUnlockDialog = dynamic(
  () =>
    import("@/components/dialogs/LockUnlockDialog").then(
      (m) => m.LockUnlockDialog,
    ),
  { ssr: false },
);
const SyncOfflineFilesDialog = dynamic(
  () =>
    import("@/components/auth/SyncOfflineFilesDialog").then(
      (m) => m.SyncOfflineFilesDialog,
    ),
  { ssr: false },
);
const CreateWorkspaceModal = dynamic(
  () =>
    import("@/components/workspace/CreateWorkspaceModal").then(
      (m) => m.CreateWorkspaceModal,
    ),
  { ssr: false },
);
const RenameWorkspaceModal = dynamic(
  () =>
    import("@/components/workspace/RenameWorkspaceModal").then(
      (m) => m.RenameWorkspaceModal,
    ),
  { ssr: false },
);
const DeleteWorkspaceModal = dynamic(
  () =>
    import("@/components/workspace/DeleteWorkspaceModal").then(
      (m) => m.DeleteWorkspaceModal,
    ),
  { ssr: false },
);

export function AppShell() {
  useKeyboardShortcuts();
  useAuthBootstrap();
  useAppBootstrap();

  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const bottomPanelVisible = useUIStore((s) => s.bottomPanelVisible);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const isMobile = useIsMobile();

  return (
    <div className="np-app-shell bg-background text-foreground flex h-full min-h-0 flex-1 flex-col">
      {/* Skip-to-editor link for keyboard users */}
      <a
        href="#editor-main"
        className="focus:bg-background focus:text-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:ring-2"
      >
        Skip to editor
      </a>
      <GlobalActionsRegistrar />
      <ApiLoadingBar />
      <CenterApiLoader />

      {isMobile ? (
        <>
          <MobileAppBar />
          <MobileMenuSheet />
        </>
      ) : (
        <MenuBar />
      )}

      {/* ── Main body ─────────────────────────────────────────────────────── */}
      {isMobile ? (
        <div className="min-h-0 flex-1">
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <EditorArea />
            </div>
            {bottomPanelVisible && (
              <div className="h-1/2 shrink-0 border-t">
                <BottomPanel />
              </div>
            )}
          </div>
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent
              side="left"
              className="w-[min(88vw,22rem)] gap-0 p-0 sm:max-w-sm"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>File Explorer</SheetTitle>
              </SheetHeader>
              <FileExplorer />
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        /* ── Desktop: Left Rail + Resizable Workspace Panels + Right Rail ── */
        <div className="bg-background flex min-h-0 flex-1 overflow-hidden">
          {/* Left navigation rail (primary explorer and quick file actions) */}
          <IconNavRail />

          {/* min-h-0 flex-1 gives react-resizable-panels a properly-sized parent */}
          <div className="bg-background min-h-0 flex-1 overflow-hidden">
            <ResizablePanelGroup orientation="horizontal">
              {sidebarVisible && (
                <>
                  <ResizablePanel
                    defaultSize="260px"
                    minSize="180px"
                    maxSize="450px"
                    groupResizeBehavior="preserve-pixel-size"
                  >
                    <CollectionsSidebar />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                </>
              )}
              <ResizablePanel>
                <ResizablePanelGroup orientation="vertical">
                  <ResizablePanel
                    defaultSize={bottomPanelVisible ? "70%" : "100%"}
                    minSize="30%"
                  >
                    <EditorArea />
                  </ResizablePanel>
                  {bottomPanelVisible && (
                    <>
                      <ResizableHandle withHandle />
                      <ResizablePanel
                        defaultSize="30%"
                        minSize="10%"
                        maxSize="70%"
                      >
                        <BottomPanel />
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Right navigation rail (quick developer tools, converters, diff, and AI) */}
          <ToolsNavRail />
        </div>
      )}

      <StatusBar />

      {/* Global dialogs */}
      <SettingsDialog />
      <QuickOpenDialog />
      <CommandPalette />
      <AboutDialog />
      <ExportImportDialog />
      <WorkspaceStatsDialog />
      <SyncOfflineFilesDialog />
      <LockUnlockDialog />
      <CreateWorkspaceModal />
      <RenameWorkspaceModal />
      <DeleteWorkspaceModal />
    </div>
  );
}
