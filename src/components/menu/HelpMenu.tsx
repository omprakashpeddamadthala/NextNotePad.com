"use client";

import {
  Keyboard,
  Info,
  BarChart3,
  BookOpen,
  ShieldCheck,
  CircleHelp,
} from "lucide-react";
import { TopMenu } from "./TopMenu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDialogStore } from "@/store/dialogStore";

const HELP_LINKS = [
  { href: "/features", label: "Features & Guides", Icon: BookOpen },
  { href: "/security", label: "Privacy & Security", Icon: ShieldCheck },
  { href: "/faq", label: "FAQ", Icon: CircleHelp },
];

export function HelpMenu() {
  const openDialog = useDialogStore((s) => s.openDialog);

  return (
    <TopMenu label="Help">
      <DropdownMenuItem onSelect={() => openDialog("commandPalette")}>
        <Keyboard /> Keyboard Shortcuts &amp; Commands
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => openDialog("workspaceStats")}>
        <BarChart3 /> Workspace Statistics
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => openDialog("about")}>
        <Info /> About NextNotePad.com
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {/* Opens in a new tab so the editor and any unsaved work stay put. */}
      {HELP_LINKS.map(({ href, label, Icon }) => (
        <DropdownMenuItem key={href} asChild>
          <a href={href} target="_blank" rel="noopener">
            <Icon /> {label}
          </a>
        </DropdownMenuItem>
      ))}
    </TopMenu>
  );
}
