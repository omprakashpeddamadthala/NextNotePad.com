"use client";

import { MenuBar } from "./MenuBar";
import { Toolbar } from "./Toolbar";
import { MobileAppBar } from "./MobileAppBar";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { StatusBar } from "./StatusBar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUIStore } from "@/store/uiStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { FileExplorer } from "@/components/explorer/FileExplorer";
import { EditorArea } from "@/components/editor/EditorArea";
import { BottomPanel } from "@/components/panels/BottomPanel";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { QuickOpenDialog } from "@/components/search/QuickOpenDialog";
import { CommandPalette } from "@/components/search/CommandPalette";
import { AboutDialog } from "@/components/dialogs/AboutDialog";
import { ExportImportDialog } from "@/components/dialogs/ExportImportDialog";
import { WorkspaceStatsDialog } from "@/components/dialogs/WorkspaceStatsDialog";
import { LockUnlockDialog } from "@/components/dialogs/LockUnlockDialog";
import { SyncOfflineFilesDialog } from "@/components/auth/SyncOfflineFilesDialog";
import { useAppBootstrap } from "@/hooks/useAppBootstrap";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { GlobalActionsRegistrar } from "./GlobalActionsRegistrar";

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
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background text-foreground">
      <GlobalActionsRegistrar />
      {isMobile ? (
        <>
          <MobileAppBar />
          <MobileMenuSheet />
        </>
      ) : (
        <>
          <MenuBar />
          <Toolbar />
        </>
      )}
      <div className="min-h-0 flex-1">
        {isMobile ? (
          <>
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
              <SheetContent side="left" className="w-4/5 p-0 sm:max-w-xs">
                <SheetHeader className="sr-only">
                  <SheetTitle>File Explorer</SheetTitle>
                </SheetHeader>
                <FileExplorer />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <ResizablePanelGroup orientation="horizontal">
            {sidebarVisible && (
              <>
                <ResizablePanel defaultSize="18%" minSize="12%" maxSize="40%">
                  <FileExplorer />
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}
            <ResizablePanel defaultSize={sidebarVisible ? "82%" : "100%"}>
              <ResizablePanelGroup orientation="vertical">
                <ResizablePanel defaultSize={bottomPanelVisible ? "70%" : "100%"} minSize="30%">
                  <EditorArea />
                </ResizablePanel>
                {bottomPanelVisible && (
                  <>
                    <ResizableHandle />
                    <ResizablePanel defaultSize="30%" minSize="10%" maxSize="70%">
                      <BottomPanel />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
      <StatusBar />

      <SettingsDialog />
      <QuickOpenDialog />
      <CommandPalette />
      <AboutDialog />
      <ExportImportDialog />
      <WorkspaceStatsDialog />
      <SyncOfflineFilesDialog />
      <LockUnlockDialog />
    </div>
  );
}
