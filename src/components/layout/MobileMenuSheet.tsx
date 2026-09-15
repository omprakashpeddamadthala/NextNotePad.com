"use client";

import { HardDriveDownload } from "lucide-react";
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
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { AppLogo } from "@/components/ui/AppLogo";
import { APP_BRAND } from "@/lib/constants/branding";

/** Gives every command category one touch-friendly home on mobile. */
function MenuGridCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border/70 bg-background/70 active:bg-accent rounded-xl border text-center shadow-xs transition-colors [&>button]:flex [&>button]:h-12 [&>button]:w-full [&>button]:items-center [&>button]:justify-center [&>button]:px-2 [&>button]:py-2.5">
      {children}
    </div>
  );
}

/** Mobile counterpart to the desktop menu bar. Commands are intentionally not repeated as a
 * second action grid: each capability has one predictable menu category. */
export function MobileMenuSheet() {
  const open = useUIStore((s) => s.mobileMenuSheetOpen);
  const setOpen = useUIStore((s) => s.setMobileMenuSheetOpen);
  const authStatus = useAuthStore((s) => s.status);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        className="np-scrollbar bg-popover/98 max-h-[92dvh] gap-0 overflow-y-auto rounded-t-3xl border-x p-0"
      >
        <SheetHeader className="bg-popover/95 sticky top-0 z-10 flex-row items-center gap-3 border-b p-4 backdrop-blur-xl">
          <AppLogo size="md" />
          <div>
            <SheetTitle>{APP_BRAND.name}</SheetTitle>
            <p className="text-muted-foreground text-xs">
              Choose a menu to find its commands
            </p>
          </div>
        </SheetHeader>

        <div className="bg-muted/20 flex items-center justify-between gap-3 border-b p-4">
          <AccountMenu />
          <SyncStatusBadge />
        </div>

        {authStatus === "guest" && (
          <p className="bg-muted/20 text-muted-foreground flex items-center gap-1.5 border-b px-4 pb-3 text-xs">
            <HardDriveDownload className="size-3.5" />
            Guest Mode — stored locally
          </p>
        )}

        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <p className="text-muted-foreground mb-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase">
            Menus
          </p>
          <div className="grid grid-cols-3 gap-2.5">
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
              <WindowMenu />
            </MenuGridCell>
            <MenuGridCell>
              <HelpMenu />
            </MenuGridCell>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
