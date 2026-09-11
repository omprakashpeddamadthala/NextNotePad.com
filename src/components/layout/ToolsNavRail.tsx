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
  Columns2,
  type LucideIcon,
} from "lucide-react";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { useDialogStore } from "@/store/dialogStore";
import { useUIStore } from "@/store/uiStore";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { toast } from "sonner";
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
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            "relative flex size-8 items-center justify-center rounded-md transition-all duration-150 shrink-0 outline-none",
            "hover:bg-accent/80 hover:text-foreground hover:scale-105 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ring",
            active
              ? "text-primary bg-primary/15 shadow-2xs ring-1 ring-primary/25"
              : "text-muted-foreground/80",
          )}
        >
          <Icon className="size-4 transition-transform duration-150" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs font-medium">{label}</TooltipContent>
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
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={label}
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition-all duration-150 shrink-0 text-muted-foreground/80 outline-none",
                "hover:bg-accent/80 hover:text-foreground hover:scale-105 active:scale-95",
                "focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ring",
              )}
            >
              <Icon className="size-4 transition-transform duration-150" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs font-medium">{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="left" align="start" className="w-52">
        <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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

  // Markdown preview toggle — mirrors Toolbar logic
  const markdownPreviewVisible = useUIStore((s) => s.markdownPreviewVisible);
  const toggleMarkdownPreview = useUIStore((s) => s.toggleMarkdownPreview);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const activeFileId = useTabsStore(
    (s) => s.tabs.find((t) => t.id === activeTabId)?.fileId,
  );
  const activeNode = useWorkspaceStore((s) =>
    activeFileId ? s.nodes[activeFileId] : undefined,
  );
  const isMarkdownActive =
    activeNode?.type === "file" && activeNode.language === "markdown";
  const previewOn = markdownPreviewVisible && isMarkdownActive;

  return (
    <TooltipProvider>
      <nav
        aria-label="Tools vertical right rail"
        className="np-scrollbar flex w-10 shrink-0 flex-col items-center gap-1 border-l bg-[var(--np-toolbar-bg)]/80 py-2.5 overflow-y-auto overflow-x-hidden backdrop-blur-xs select-none"
        style={{ borderLeftColor: "var(--np-tab-border)" }}
      >
        {/* ── Markdown Preview ─────────────────────────────────────────────── */}
        <ActionIconButton
          icon={Columns2}
          label="Toggle MD Preview (side-by-side)"
          active={previewOn}
          onClick={() => {
            if (!isMarkdownActive) {
              toast.error("Open a markdown (.md) file first to preview it.");
              return;
            }
            toggleMarkdownPreview();
          }}
        />
        <Separator className="my-1.5 w-4 opacity-30" />
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

        <Separator className="my-1 w-5 opacity-40" />

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

        <Separator className="my-1 w-5 opacity-40" />

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

        <Separator className="my-1 w-5 opacity-40" />

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
