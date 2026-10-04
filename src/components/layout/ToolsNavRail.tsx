"use client";

import { useState } from "react";
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
  KeyRound,
  Code2,
  Quote,
  Calculator,
  Palette,
  SquareSlash,
  Columns2,
  Search,
  X,
  FileDiff,
  BarChart3,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { useUIStore } from "@/store/uiStore";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { toast } from "sonner";
import {
  HASH_ALGORITHMS,
  type CaseConverterId,
} from "@/services/textTools/textTools";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

type CategoryFilter = "all" | "code" | "text" | "crypto" | "utils";

export function ToolsNavRail() {
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const toggleToolsRail = useUIStore((s) => s.toggleToolsRail);
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
    activeNode?.type === "file" &&
    (activeNode.language === "markdown" ||
      activeNode.name.toLowerCase().endsWith(".md") ||
      activeNode.name.toLowerCase().endsWith(".markdown"));
  const previewOn = markdownPreviewVisible && isMarkdownActive;

  const q = filter.trim().toLowerCase();

  return (
    <aside
      aria-label="Developer Toolkit"
      className="flex h-full w-full flex-col select-none overflow-hidden border-l"
      style={{
        background: "var(--np-sidebar-bg)",
        borderLeftColor: "var(--np-sidebar-border)",
      }}
    >
      <div
        className="flex h-10 shrink-0 items-center justify-between border-b px-3"
        style={{ borderBottomColor: "var(--np-sidebar-border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
            <Sparkles className="size-3.5" />
          </div>
          <span className="font-heading text-xs font-semibold tracking-tight text-foreground">
            Dev Toolkit
          </span>
        </div>
        <button
          type="button"
          onClick={() => toggleToolsRail()}
          aria-label="Close Developer Toolkit"
          className="text-muted-foreground/60 hover:text-foreground hover:bg-accent/50 flex size-6 items-center justify-center rounded-md transition-colors cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div
        className="border-b px-2.5 py-2 shrink-0"
        style={{ borderBottomColor: "var(--np-sidebar-border)" }}
      >
        <div className="border-border/60 bg-background/70 focus-within:border-primary/40 focus-within:ring-primary/10 relative flex w-full items-center rounded-lg border px-2 transition-all focus-within:ring-1">
          <Search className="text-muted-foreground/40 pointer-events-none size-3 shrink-0" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search dev tools…"
            className="placeholder:text-muted-foreground/45 h-7 flex-1 border-none bg-transparent pr-4 pl-1.5 text-[11.5px] shadow-none focus-visible:ring-0"
            aria-label="Search developer tools"
          />
          {filter && (
            <button
              type="button"
              aria-label="Clear filter"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setFilter("")}
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {(
            [
              { id: "all", label: "All" },
              { id: "code", label: "Code" },
              { id: "text", label: "Text" },
              { id: "crypto", label: "Crypto" },
              { id: "utils", label: "Utils" },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer shrink-0",
                category === c.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="np-scrollbar min-h-0 flex-1 overflow-y-auto p-2 space-y-3">
        {(category === "all" || category === "code") && (
          <ToolSection title="Preview & AI">
            <ToolButton
              icon={Columns2}
              iconColor="text-indigo-400"
              title="Markdown Preview"
              subtitle="Side-by-side live render"
              active={previewOn}
              onClick={() => {
                if (!isMarkdownActive) {
                  toast.error("Open a markdown (.md) file first to preview it.");
                  return;
                }
                toggleMarkdownPreview();
              }}
              filter={q}
            />

            <ToolDropdown
              icon={Sparkles}
              iconColor="text-amber-400"
              title="Fix Grammar & Spelling"
              subtitle="AI text polish"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.ai.fixGrammar.gemini")}>
                Fix with Gemini
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.ai.fixGrammar.claude")}>
                Fix with Claude (AgentRouter)
              </DropdownMenuItem>
            </ToolDropdown>

            <ToolDropdown
              icon={FileCode}
              iconColor="text-cyan-400"
              title="Generate MD Syntax"
              subtitle="AI markdown generator"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.ai.generateMdSyntax.gemini")}>
                Generate with Gemini
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.ai.generateMdSyntax.claude")}>
                Generate with Claude
              </DropdownMenuItem>
            </ToolDropdown>

            <ToolDropdown
              icon={Wand2}
              iconColor="text-purple-400"
              title="Generate Prompt"
              subtitle="AI prompt builder"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.ai.generatePrompt.gemini")}>
                Prompt with Gemini
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.ai.generatePrompt.claude")}>
                Prompt with Claude
              </DropdownMenuItem>
            </ToolDropdown>
          </ToolSection>
        )}

        {(category === "all" || category === "code") && (
          <ToolSection title="Code & Formatting">
            <ToolDropdown
              icon={FileJson}
              iconColor="text-emerald-400"
              title="JSON Tools"
              subtitle="Format / minify JSON"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.json.format")}>
                Format / Prettify JSON
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.json.minify")}>
                Minify JSON
              </DropdownMenuItem>
            </ToolDropdown>

            <ToolDropdown
              icon={Code2}
              iconColor="text-blue-400"
              title="HTML Encode / Decode"
              subtitle="Entity conversion"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.html.encode")}>
                HTML Encode
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.html.decode")}>
                HTML Decode
              </DropdownMenuItem>
            </ToolDropdown>

            <ToolDropdown
              icon={Quote}
              iconColor="text-violet-400"
              title="String Escape / Unescape"
              subtitle="JSON string escape"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.escapeString.escape")}>
                Escape for JSON
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.escapeString.unescape")}>
                Unescape from JSON
              </DropdownMenuItem>
            </ToolDropdown>
          </ToolSection>
        )}

        {(category === "all" || category === "text") && (
          <ToolSection title="Text Transformations">
            <ToolDropdown
              icon={CaseSensitive}
              iconColor="text-pink-400"
              title="Case Converter"
              subtitle="Upper, lower, camel, snake..."
              filter={q}
            >
              {CASE_OPTIONS.map(({ id, label }) => (
                <DropdownMenuItem
                  key={id}
                  onSelect={() => runAction(`tools.case.${id}`)}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </ToolDropdown>

            <ToolDropdown
              icon={ArrowDownAZ}
              iconColor="text-teal-400"
              title="Sort & Dedupe Lines"
              subtitle="Alphabetize / remove duplicates"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.lines.sortAsc")}>
                Sort Ascending (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.lines.sortDesc")}>
                Sort Descending (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.lines.dedupe")}>
                Remove Duplicate Lines
              </DropdownMenuItem>
            </ToolDropdown>

            <ToolDropdown
              icon={Eraser}
              iconColor="text-amber-400"
              title="Whitespace Cleanup"
              subtitle="Trim, collapse, tabs/spaces"
              filter={q}
            >
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
            </ToolDropdown>

            <ToolButton
              icon={SquareSlash}
              iconColor="text-lime-400"
              title="Slugify"
              subtitle="URL-friendly text string"
              onClick={() => runAction("tools.slugify")}
              filter={q}
            />
          </ToolSection>
        )}

        {(category === "all" || category === "crypto") && (
          <ToolSection title="Crypto & Encoders">
            <ToolDropdown
              icon={Binary}
              iconColor="text-emerald-400"
              title="Base64 Encode / Decode"
              subtitle="Standard base64 conversion"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.base64Encode")}>
                Base64 Encode
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.base64Decode")}>
                Base64 Decode
              </DropdownMenuItem>
            </ToolDropdown>

            <ToolDropdown
              icon={Link2}
              iconColor="text-sky-400"
              title="URL Encode / Decode"
              subtitle="URI component encoding"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.urlEncode")}>
                URL Encode
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.urlDecode")}>
                URL Decode
              </DropdownMenuItem>
            </ToolDropdown>

            <ToolDropdown
              icon={Hash}
              iconColor="text-orange-400"
              title="Hash Generator"
              subtitle="MD5, SHA-1, SHA-256..."
              filter={q}
            >
              {HASH_ALGORITHMS.map((algo) => (
                <DropdownMenuItem
                  key={algo}
                  onSelect={() => runAction(`tools.hash.${algo}`)}
                >
                  {algo}
                </DropdownMenuItem>
              ))}
            </ToolDropdown>

            <ToolButton
              icon={KeyRound}
              iconColor="text-yellow-400"
              title="Decode JWT"
              subtitle="Inspect header & payload"
              onClick={() => runAction("tools.jwtDecode")}
              filter={q}
            />
          </ToolSection>
        )}

        {(category === "all" || category === "utils") && (
          <ToolSection title="Productivity Utilities">
            <ToolButton
              icon={FileDiff}
              iconColor="text-cyan-400"
              title="Diff Checker"
              subtitle="Side-by-side text diff"
              onClick={() => runAction("tools.diffChecker")}
              filter={q}
            />

            <ToolButton
              icon={BarChart3}
              iconColor="text-indigo-400"
              title="Text Statistics"
              subtitle="Words, chars, read time"
              onClick={() => runAction("tools.textStats")}
              filter={q}
            />

            <ToolButton
              icon={Fingerprint}
              iconColor="text-purple-400"
              title="Generate UUID"
              subtitle="RFC 4122 v4 unique ID"
              onClick={() => runAction("tools.generateUuid")}
              filter={q}
            />

            <ToolDropdown
              icon={Clock}
              iconColor="text-blue-400"
              title="Timestamp Converter"
              subtitle="Unix timestamp & ISO"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.timestamp.unixToIso")}>
                Unix Timestamp to ISO Date
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.timestamp.isoToUnix")}>
                ISO Date to Unix Timestamp
              </DropdownMenuItem>
            </ToolDropdown>

            <ToolDropdown
              icon={Calculator}
              iconColor="text-emerald-400"
              title="Number Base Converter"
              subtitle="Dec, Hex, Bin converter"
              filter={q}
            >
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
            </ToolDropdown>

            <ToolDropdown
              icon={Palette}
              iconColor="text-rose-400"
              title="Color Converter"
              subtitle="HEX & RGB color format"
              filter={q}
            >
              <DropdownMenuItem onSelect={() => runAction("tools.color.hexToRgb")}>
                Hex to RGB
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runAction("tools.color.rgbToHex")}>
                RGB to Hex
              </DropdownMenuItem>
            </ToolDropdown>
          </ToolSection>
        )}
      </div>
    </aside>
  );
}

function ToolSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <h3 className="px-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/60">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  active,
  onClick,
  filter,
}: {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle: string;
  active?: boolean;
  onClick: () => void;
  filter: string;
}) {
  if (
    filter &&
    !title.toLowerCase().includes(filter) &&
    !subtitle.toLowerCase().includes(filter)
  ) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-all duration-150 cursor-pointer outline-none",
        active
          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
          : "hover:bg-accent/60 text-foreground",
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 transition-transform duration-150 group-hover:scale-105",
          active && "bg-primary/20",
        )}
      >
        <Icon className={cn("size-3.5", iconColor || "text-foreground")} />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-[11.5px] font-medium">{title}</div>
        <div className="truncate text-[10px] text-muted-foreground/70">
          {subtitle}
        </div>
      </div>
    </button>
  );
}

function ToolDropdown({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  children,
  filter,
}: {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  filter: string;
}) {
  if (
    filter &&
    !title.toLowerCase().includes(filter) &&
    !subtitle.toLowerCase().includes(filter)
  ) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-all duration-150 hover:bg-accent/60 text-foreground cursor-pointer outline-none"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 transition-transform duration-150 group-hover:scale-105">
            <Icon className={cn("size-3.5", iconColor || "text-foreground")} />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[11.5px] font-medium">{title}</div>
            <div className="truncate text-[10px] text-muted-foreground/70">
              {subtitle}
            </div>
          </div>
          <ChevronDown className="size-3 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
          {title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
