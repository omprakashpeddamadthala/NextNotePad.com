"use client";

import {
  Binary,
  Link2,
  Code2,
  CaseSensitive,
  Hash,
  FileDiff,
  KeyRound,
  Sparkles,
  Fingerprint,
  FileText,
  Lock,
  ArrowLeftRight,
  Clock,
  Palette,
  Link as LinkIcon,
  Regex,
  FileJson,
} from "lucide-react";
import { TopMenu } from "./TopMenu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { runAction } from "@/services/shortcuts/actionRegistry";
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
 *  selected, or at the cursor for generators) — same convention as Format Document — instead of
 *  opening a separate copy/paste dialog. Diff Checker, Regex Tester, and JSON Converter stay
 *  on-tab too: they replace the editor content with their own view, rather than a popup. */
export function ToolsMenu() {
  return (
    <TopMenu label="Tools">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <ArrowLeftRight /> Encode / Decode
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
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
          <DropdownMenuItem onSelect={() => runAction("tools.htmlEntityEncode")}>
            <Code2 /> HTML Entity Encode
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.htmlEntityDecode")}>
            <Code2 /> HTML Entity Decode
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

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

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Sparkles /> Generators
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.uuidGenerate")}>
            <Fingerprint /> UUID (insert at cursor)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.loremIpsum")}>
            <FileText /> Lorem Ipsum (insert at cursor)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.randomPassword")}>
            <Lock /> Random Password (insert at cursor)
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <ArrowLeftRight /> Converters
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.timestampConvert")}>
            <Clock /> Timestamp ↔ Date
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.colorConvert")}>
            <Palette /> Color (HEX → RGB → HSL)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.slugGenerate")}>
            <LinkIcon /> Slugify
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuItem onSelect={() => runAction("tools.jwtDecode")}>
        <KeyRound /> JWT Decode
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => runAction("tools.diffChecker")}>
        <FileDiff /> Diff Checker
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("tools.regexTester")}>
        <Regex /> Regex Tester
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("tools.jsonConverter")}>
        <FileJson /> JSON Converter (CSV/YAML)
      </DropdownMenuItem>
    </TopMenu>
  );
}
