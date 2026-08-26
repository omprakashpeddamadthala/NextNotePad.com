"use client";

import {
  Binary,
  Link2,
  CaseSensitive,
  Hash,
  FileDiff,
  Sparkles,
  FileJson,
  ArrowDownAZ,
  Eraser,
  BarChart3,
  Fingerprint,
  Clock,
  KeyRound,
  Code2,
  Quote,
  Calculator,
  Palette,
  SquareSlash,
  FileCode,
  Wand2,
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
import {
  HASH_ALGORITHMS,
  type CaseConverterId,
} from "@/services/textTools/textTools";

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
 *  dialog. Diff Checker also stays on-tab: it replaces the editor content with two open tabs
 *  side by side on Monaco's diff editor, rather than a popup. Fix Grammar & Spelling is the one
 *  async, network-backed item — its submenu picks which provider (Gemini or Claude via
 *  AgentRouter) handles this one call, overriding Settings > General's default for just this run. */
export function ToolsMenu() {
  return (
    <TopMenu label="Tools">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Sparkles /> Fix Grammar &amp; Spelling (AI)
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.ai.fixGrammar.gemini")}>
            Gemini
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.ai.fixGrammar.claude")}>
            Claude (via AgentRouter)
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <FileCode /> Generate MD Syntax (AI)
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.ai.generateMdSyntax.gemini")}>
            Gemini
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.ai.generateMdSyntax.claude")}>
            Claude (via AgentRouter)
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Wand2 /> Generate Prompt (AI)
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.ai.generatePrompt.gemini")}>
            Gemini
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.ai.generatePrompt.claude")}>
            Claude (via AgentRouter)
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
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
            <DropdownMenuItem
              key={id}
              onSelect={() => runAction(`tools.case.${id}`)}
            >
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
            <DropdownMenuItem
              key={algo}
              onSelect={() => runAction(`tools.hash.${algo}`)}
            >
              {algo} (copy to clipboard)
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <FileJson /> JSON
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.json.format")}>
            Format JSON
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.json.minify")}>
            Minify JSON
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <ArrowDownAZ /> Sort &amp; Dedupe Lines
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.lines.sortAsc")}>
            Sort Ascending (A-Z)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.lines.sortDesc")}>
            Sort Descending (Z-A)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.lines.dedupe")}>
            Remove Duplicate Lines
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Eraser /> Whitespace Cleanup
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.whitespace.trimTrailing")}>
            Trim Trailing Whitespace
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.whitespace.collapseBlankLines")}>
            Collapse Blank Lines
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.whitespace.tabsToSpaces")}>
            Tabs to Spaces
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.whitespace.spacesToTabs")}>
            Spaces to Tabs
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Clock /> Timestamp Converter
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.timestamp.unixToIso")}>
            Unix Timestamp to ISO Date
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.timestamp.isoToUnix")}>
            ISO Date to Unix Timestamp
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem onSelect={() => runAction("tools.generateUuid")}>
        <Fingerprint /> Generate UUID
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => runAction("tools.textStats")}>
        <BarChart3 /> Word / Character Count
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => runAction("tools.jwtDecode")}>
        <KeyRound /> Decode JWT
      </DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Code2 /> HTML
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.html.encode")}>
            HTML Encode
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.html.decode")}>
            HTML Decode
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Quote /> Escape String
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.escapeString.escape")}>
            Escape (for JSON)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.escapeString.unescape")}>
            Unescape (from JSON)
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Calculator /> Number Base Converter
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.base.decToHex")}>
            Decimal to Hex
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.base.hexToDec")}>
            Hex to Decimal
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.base.decToBin")}>
            Decimal to Binary
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.base.binToDec")}>
            Binary to Decimal
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Palette /> Color Converter
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={() => runAction("tools.color.hexToRgb")}>
            Hex to RGB
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.color.rgbToHex")}>
            RGB to Hex
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem onSelect={() => runAction("tools.slugify")}>
        <SquareSlash /> Slugify
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => runAction("tools.diffChecker")}>
        <FileDiff /> Diff Checker
      </DropdownMenuItem>
    </TopMenu>
  );
}
