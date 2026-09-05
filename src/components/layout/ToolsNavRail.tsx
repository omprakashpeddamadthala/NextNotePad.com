"use client";

import {
  Sparkles,
  FileCode,
  Wand2,
  Binary,
  Link2,
  CaseSensitive,
  Hash,
  FileJson,
  ArrowDownAZ,
  Eraser,
  Clock,
  Fingerprint,
  BarChart3,
  KeyRound,
  Code2,
  Quote,
  Calculator,
  Palette,
  SquareSlash,
  FileDiff,
  Command as CommandIcon,
  type LucideIcon,
} from "lucide-react";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { useDialogStore } from "@/store/dialogStore";
import { HASH_ALGORITHMS, type CaseConverterId } from "@/services/textTools/textTools";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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

function ActionIconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "flex size-8 items-center justify-center rounded-md transition-colors shrink-0 text-muted-foreground",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Icon className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}

function DropdownIconButton({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={label}
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition-colors shrink-0 text-muted-foreground",
                "hover:bg-accent hover:text-accent-foreground outline-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <Icon className="size-4" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="left" align="start" className="w-52">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ToolsNavRail() {
  const openDialog = useDialogStore((s) => s.openDialog);

  return (
    <TooltipProvider>
      <nav
        aria-label="Tools vertical right rail"
        className="np-scrollbar flex w-10 shrink-0 flex-col items-center gap-1 border-l bg-background py-2 overflow-y-auto overflow-x-hidden"
      >
        {/* ── AI Tools ────────────────────────────────────────────────────── */}
        <DropdownIconButton icon={Sparkles} label="Fix Grammar & Spelling (AI)">
          <DropdownMenuItem onSelect={() => runAction("tools.ai.fixGrammar.gemini")}>
            Gemini
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.ai.fixGrammar.claude")}>
            Claude (via AgentRouter)
          </DropdownMenuItem>
        </DropdownIconButton>

        <DropdownIconButton icon={FileCode} label="Generate MD Syntax (AI)">
          <DropdownMenuItem onSelect={() => runAction("tools.ai.generateMdSyntax.gemini")}>
            Gemini
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.ai.generateMdSyntax.claude")}>
            Claude (via AgentRouter)
          </DropdownMenuItem>
        </DropdownIconButton>

        <DropdownIconButton icon={Wand2} label="Generate Prompt (AI)">
          <DropdownMenuItem onSelect={() => runAction("tools.ai.generatePrompt.gemini")}>
            Gemini
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.ai.generatePrompt.claude")}>
            Claude (via AgentRouter)
          </DropdownMenuItem>
        </DropdownIconButton>

        <Separator className="my-1 w-6" />

        {/* ── Encoders & Text Tools ───────────────────────────────────────── */}
        <DropdownIconButton icon={Binary} label="Base64 Encode / Decode">
          <DropdownMenuItem onSelect={() => runAction("tools.base64Encode")}>
            Base64 Encode
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.base64Decode")}>
            Base64 Decode
          </DropdownMenuItem>
        </DropdownIconButton>

        <DropdownIconButton icon={Link2} label="URL Encode / Decode">
          <DropdownMenuItem onSelect={() => runAction("tools.urlEncode")}>
            URL Encode
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.urlDecode")}>
            URL Decode
          </DropdownMenuItem>
        </DropdownIconButton>

        <DropdownIconButton icon={CaseSensitive} label="Case Converter">
          {CASE_OPTIONS.map(({ id, label }) => (
            <DropdownMenuItem key={id} onSelect={() => runAction(`tools.case.${id}`)}>
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownIconButton>

        <DropdownIconButton icon={Hash} label="Hash Generator">
          {HASH_ALGORITHMS.map((algo) => (
            <DropdownMenuItem key={algo} onSelect={() => runAction(`tools.hash.${algo}`)}>
              {algo}
            </DropdownMenuItem>
          ))}
        </DropdownIconButton>

        <DropdownIconButton icon={FileJson} label="JSON Tools">
          <DropdownMenuItem onSelect={() => runAction("tools.json.format")}>
            Format JSON
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.json.minify")}>
            Minify JSON
          </DropdownMenuItem>
        </DropdownIconButton>

        <DropdownIconButton icon={ArrowDownAZ} label="Sort & Dedupe Lines">
          <DropdownMenuItem onSelect={() => runAction("tools.lines.sortAsc")}>
            Sort Ascending (A-Z)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.lines.sortDesc")}>
            Sort Descending (Z-A)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.lines.dedupe")}>
            Remove Duplicate Lines
          </DropdownMenuItem>
        </DropdownIconButton>

        <DropdownIconButton icon={Eraser} label="Whitespace Cleanup">
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
        </DropdownIconButton>

        <DropdownIconButton icon={Clock} label="Timestamp Converter">
          <DropdownMenuItem onSelect={() => runAction("tools.timestamp.unixToIso")}>
            Unix Timestamp to ISO Date
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.timestamp.isoToUnix")}>
            ISO Date to Unix Timestamp
          </DropdownMenuItem>
        </DropdownIconButton>

        <ActionIconButton
          icon={Fingerprint}
          label="Generate UUID"
          onClick={() => runAction("tools.generateUuid")}
        />

        <ActionIconButton
          icon={BarChart3}
          label="Word / Character Count"
          onClick={() => runAction("tools.textStats")}
        />

        <Separator className="my-1 w-6" />

        <ActionIconButton
          icon={KeyRound}
          label="Decode JWT"
          onClick={() => runAction("tools.jwtDecode")}
        />

        <DropdownIconButton icon={Code2} label="HTML Encode / Decode">
          <DropdownMenuItem onSelect={() => runAction("tools.html.encode")}>
            HTML Encode
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.html.decode")}>
            HTML Decode
          </DropdownMenuItem>
        </DropdownIconButton>

        <DropdownIconButton icon={Quote} label="Escape String">
          <DropdownMenuItem onSelect={() => runAction("tools.escapeString.escape")}>
            Escape (for JSON)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.escapeString.unescape")}>
            Unescape (from JSON)
          </DropdownMenuItem>
        </DropdownIconButton>

        <DropdownIconButton icon={Calculator} label="Number Base Converter">
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
        </DropdownIconButton>

        <DropdownIconButton icon={Palette} label="Color Converter">
          <DropdownMenuItem onSelect={() => runAction("tools.color.hexToRgb")}>
            Hex to RGB
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => runAction("tools.color.rgbToHex")}>
            RGB to Hex
          </DropdownMenuItem>
        </DropdownIconButton>

        <ActionIconButton
          icon={SquareSlash}
          label="Slugify"
          onClick={() => runAction("tools.slugify")}
        />

        <Separator className="my-1 w-6" />

        <ActionIconButton
          icon={FileDiff}
          label="Diff Checker"
          onClick={() => runAction("tools.diffChecker")}
        />

        <ActionIconButton
          icon={CommandIcon}
          label="Search All Commands (Ctrl+Shift+P)"
          onClick={() => openDialog("commandPalette")}
        />
      </nav>
    </TooltipProvider>
  );
}
