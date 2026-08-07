"use client";

import { Keyboard, Info, BarChart3 } from "lucide-react";
import { TopMenu } from "./TopMenu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/store/uiStore";

export function HelpMenu() {
  const setAboutOpen = useUIStore((s) => s.setAboutDialogOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setWorkspaceStatsOpen = useUIStore((s) => s.setWorkspaceStatsOpen);

  return (
    <TopMenu label="Help">
      <DropdownMenuItem onSelect={() => setCommandPaletteOpen(true)}>
        <Keyboard /> Keyboard Shortcuts &amp; Commands
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setWorkspaceStatsOpen(true)}>
        <BarChart3 /> Workspace Statistics
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setAboutOpen(true)}>
        <Info /> About NextNotePad.com
      </DropdownMenuItem>
    </TopMenu>
  );
}
