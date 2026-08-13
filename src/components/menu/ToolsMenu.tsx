"use client";

import { Binary, Link2, CaseSensitive, Hash, FileDiff } from "lucide-react";
import { TopMenu } from "./TopMenu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { useUIStore } from "@/store/uiStore";
import { HASH_ALGORITHMS, type CaseConverterId } from "@/services/textTools/textTools";

const CASE_OPTIONS: { id: CaseConverterId; label: string }[] = [
  { id: "upper", label: "UPPERCASE" },
  { id: "lower", label: "lowercase" },
  { id: "title", label: "Title Case" },
  { id: "sentence", label: "Sentence case" },
  { id: "camel", label: "camelCase" },
  { id: "pascal", label: "PascalCase" },
  { id: "snake", label: "snake_case" },
  { id: "kebab", label: "kebab-case" },
  { id: "constant", label: "CONSTANT_CASE" },
];

/** Every item here acts directly on the active tab's selection (or whole document if nothing is
 *  selected) — same convention as Format Document — instead of opening a separate copy/paste
 *  dialog. Diff Checker is the one exception: comparing two tabs needs two panes at once. */
export function ToolsMenu() {
  const setToolsDialogOpen = useUIStore((s) => s.setToolsDialogOpen);

  return (
    <TopMenu label="Tools">
      <DropdownMenuItem onSelect={() => runAction("tools.base64Encode")}>
        <Binary /> Base64 Encode
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("tools.base64Decode")}>
        <Binary /> Base64 Decode
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("tools.urlEncode")}>
        <Link2 /> URL Encode
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("tools.urlDecode")}>
        <Link2 /> URL Decode
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <CaseSensitive /> Case Converter
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {CASE_OPTIONS.map(({ id, label }) => (
            <DropdownMenuItem key={id} onSelect={() => runAction(`tools.case.${id}`)}>
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Hash /> Hash Generator
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {HASH_ALGORITHMS.map((algo) => (
            <DropdownMenuItem key={algo} onSelect={() => runAction(`tools.hash.${algo}`)}>
              {algo} (copy to clipboard)
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => setToolsDialogOpen(true)}>
        <FileDiff /> Diff Checker
      </DropdownMenuItem>
    </TopMenu>
  );
}
