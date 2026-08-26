"use client";

import { Fragment, useMemo } from "react";
import {
  Palette,
  Settings,
  Trash2,
  Download,
  Upload,
  Info,
  Database,
  Binary,
  Link2,
  CaseSensitive,
  Hash,
  FileDiff,
  Sparkles,
  FileJson,
  ArrowDownAZ,
  ArrowUpZA,
  ListMinus,
  Eraser,
  Rows3,
  IndentIncrease,
  IndentDecrease,
  BarChart3,
  Fingerprint,
  Clock,
  KeyRound,
  Code2,
  Quote,
  Calculator,
  SquareSlash,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import { SHORTCUTS } from "@/lib/constants/shortcuts";
import { runAction } from "@/services/shortcuts/actionRegistry";
import { THEME_ORDER } from "@/lib/constants/themes";
import { THEME_MODULES } from "@/lib/monaco/themes";
import { emptyTrash } from "@/services/fileOperations";
import { seedMockWorkspace } from "@/lib/devtools/seedMockData";
import { HASH_ALGORITHMS } from "@/services/textTools/textTools";

const CASE_COMMANDS: { id: string; label: string }[] = [
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

interface PaletteCommand {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon?: LucideIcon;
  run: () => void;
}

/** Display order for command groups — matches the app's own menu bar order (File, Edit, Search,
 *  View, Window) before the extra categories the palette adds on top. Anything not listed here
 *  (there shouldn't be any) falls back to alphabetical, appended at the end. */
const CATEGORY_ORDER = [
  "File",
  "Edit",
  "Search",
  "View",
  "Window",
  "Tools",
  "Theme",
  "Settings",
  "Help",
  "Developer",
];

function groupByCategory(commands: PaletteCommand[]): [string, PaletteCommand[]][] {
  const groups = new Map<string, PaletteCommand[]>();
  for (const cmd of commands) {
    const bucket = groups.get(cmd.category);
    if (bucket) bucket.push(cmd);
    else groups.set(cmd.category, [cmd]);
  }
  return [...groups.entries()].sort(([a], [b]) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const commands = useMemo<PaletteCommand[]>(() => {
    const shortcutCommands: PaletteCommand[] = SHORTCUTS.map((s) => ({
      id: s.action,
      label: s.label,
      category: s.category,
      shortcut: s.keys,
      run: () => runAction(s.action),
    }));

    const extraCommands: PaletteCommand[] = [
      {
        id: "open-settings",
        label: "Open Settings",
        category: "Settings",
        icon: Settings,
        run: () => useUIStore.getState().setSettingsDialogOpen(true),
      },
      {
        id: "empty-trash",
        label: "Empty Recycle Bin",
        category: "File",
        icon: Trash2,
        run: () => void emptyTrash(),
      },
      {
        id: "export-workspace",
        label: "Export Workspace (.zip)",
        category: "File",
        icon: Download,
        run: () => useUIStore.getState().setExportImportDialogOpen(true),
      },
      {
        id: "import-workspace",
        label: "Import Workspace…",
        category: "File",
        icon: Upload,
        run: () => useUIStore.getState().setExportImportDialogOpen(true),
      },
      {
        id: "about",
        label: "About NextNotePad.com",
        category: "Help",
        icon: Info,
        run: () => useUIStore.getState().setAboutDialogOpen(true),
      },
      {
        id: "tools-base64-encode",
        label: "Tools: Base64 Encode",
        category: "Tools",
        icon: Binary,
        run: () => runAction("tools.base64Encode"),
      },
      {
        id: "tools-base64-decode",
        label: "Tools: Base64 Decode",
        category: "Tools",
        icon: Binary,
        run: () => runAction("tools.base64Decode"),
      },
      {
        id: "tools-url-encode",
        label: "Tools: URL Encode",
        category: "Tools",
        icon: Link2,
        run: () => runAction("tools.urlEncode"),
      },
      {
        id: "tools-url-decode",
        label: "Tools: URL Decode",
        category: "Tools",
        icon: Link2,
        run: () => runAction("tools.urlDecode"),
      },
      ...CASE_COMMANDS.map((c) => ({
        id: `tools-case-${c.id}`,
        label: `Tools: Case — ${c.label}`,
        category: "Tools",
        icon: CaseSensitive,
        run: () => runAction(`tools.case.${c.id}`),
      })),
      ...HASH_ALGORITHMS.map((algo) => ({
        id: `tools-hash-${algo}`,
        label: `Tools: Hash — ${algo}`,
        category: "Tools",
        icon: Hash,
        run: () => runAction(`tools.hash.${algo}`),
      })),
      {
        id: "tools-diff-checker",
        label: "Tools: Diff Checker",
        category: "Tools",
        icon: FileDiff,
        run: () => runAction("tools.diffChecker"),
      },
      {
        id: "tools-ai-fix-grammar",
        label: "Tools: Fix Grammar & Spelling (AI)",
        category: "Tools",
        icon: Sparkles,
        run: () => runAction("tools.ai.fixGrammar"),
      },
      {
        id: "tools-json-format",
        label: "Tools: Format JSON",
        category: "Tools",
        icon: FileJson,
        run: () => runAction("tools.json.format"),
      },
      {
        id: "tools-json-minify",
        label: "Tools: Minify JSON",
        category: "Tools",
        icon: FileJson,
        run: () => runAction("tools.json.minify"),
      },
      {
        id: "tools-lines-sort-asc",
        label: "Tools: Sort Lines Ascending (A-Z)",
        category: "Tools",
        icon: ArrowDownAZ,
        run: () => runAction("tools.lines.sortAsc"),
      },
      {
        id: "tools-lines-sort-desc",
        label: "Tools: Sort Lines Descending (Z-A)",
        category: "Tools",
        icon: ArrowUpZA,
        run: () => runAction("tools.lines.sortDesc"),
      },
      {
        id: "tools-lines-dedupe",
        label: "Tools: Remove Duplicate Lines",
        category: "Tools",
        icon: ListMinus,
        run: () => runAction("tools.lines.dedupe"),
      },
      {
        id: "tools-whitespace-trim-trailing",
        label: "Tools: Trim Trailing Whitespace",
        category: "Tools",
        icon: Eraser,
        run: () => runAction("tools.whitespace.trimTrailing"),
      },
      {
        id: "tools-whitespace-collapse-blank-lines",
        label: "Tools: Collapse Blank Lines",
        category: "Tools",
        icon: Rows3,
        run: () => runAction("tools.whitespace.collapseBlankLines"),
      },
      {
        id: "tools-whitespace-tabs-to-spaces",
        label: "Tools: Tabs to Spaces",
        category: "Tools",
        icon: IndentIncrease,
        run: () => runAction("tools.whitespace.tabsToSpaces"),
      },
      {
        id: "tools-whitespace-spaces-to-tabs",
        label: "Tools: Spaces to Tabs",
        category: "Tools",
        icon: IndentDecrease,
        run: () => runAction("tools.whitespace.spacesToTabs"),
      },
      {
        id: "tools-text-stats",
        label: "Tools: Word / Character Count",
        category: "Tools",
        icon: BarChart3,
        run: () => runAction("tools.textStats"),
      },
      {
        id: "tools-generate-uuid",
        label: "Tools: Generate UUID",
        category: "Tools",
        icon: Fingerprint,
        run: () => runAction("tools.generateUuid"),
      },
      {
        id: "tools-timestamp-unix-to-iso",
        label: "Tools: Unix Timestamp to ISO Date",
        category: "Tools",
        icon: Clock,
        run: () => runAction("tools.timestamp.unixToIso"),
      },
      {
        id: "tools-timestamp-iso-to-unix",
        label: "Tools: ISO Date to Unix Timestamp",
        category: "Tools",
        icon: Clock,
        run: () => runAction("tools.timestamp.isoToUnix"),
      },
      {
        id: "tools-jwt-decode",
        label: "Tools: Decode JWT",
        category: "Tools",
        icon: KeyRound,
        run: () => runAction("tools.jwtDecode"),
      },
      {
        id: "tools-html-encode",
        label: "Tools: HTML Encode",
        category: "Tools",
        icon: Code2,
        run: () => runAction("tools.html.encode"),
      },
      {
        id: "tools-html-decode",
        label: "Tools: HTML Decode",
        category: "Tools",
        icon: Code2,
        run: () => runAction("tools.html.decode"),
      },
      {
        id: "tools-escape-string",
        label: "Tools: Escape String (for JSON)",
        category: "Tools",
        icon: Quote,
        run: () => runAction("tools.escapeString.escape"),
      },
      {
        id: "tools-unescape-string",
        label: "Tools: Unescape String (from JSON)",
        category: "Tools",
        icon: Quote,
        run: () => runAction("tools.escapeString.unescape"),
      },
      {
        id: "tools-base-dec-to-hex",
        label: "Tools: Decimal to Hex",
        category: "Tools",
        icon: Calculator,
        run: () => runAction("tools.base.decToHex"),
      },
      {
        id: "tools-base-hex-to-dec",
        label: "Tools: Hex to Decimal",
        category: "Tools",
        icon: Calculator,
        run: () => runAction("tools.base.hexToDec"),
      },
      {
        id: "tools-base-dec-to-bin",
        label: "Tools: Decimal to Binary",
        category: "Tools",
        icon: Calculator,
        run: () => runAction("tools.base.decToBin"),
      },
      {
        id: "tools-base-bin-to-dec",
        label: "Tools: Binary to Decimal",
        category: "Tools",
        icon: Calculator,
        run: () => runAction("tools.base.binToDec"),
      },
      {
        id: "tools-color-hex-to-rgb",
        label: "Tools: Hex to RGB",
        category: "Tools",
        icon: Palette,
        run: () => runAction("tools.color.hexToRgb"),
      },
      {
        id: "tools-color-rgb-to-hex",
        label: "Tools: RGB to Hex",
        category: "Tools",
        icon: Palette,
        run: () => runAction("tools.color.rgbToHex"),
      },
      {
        id: "tools-slugify",
        label: "Tools: Slugify",
        category: "Tools",
        icon: SquareSlash,
        run: () => runAction("tools.slugify"),
      },
      ...THEME_ORDER.map((id) => ({
        id: `theme-${id}`,
        label: `Theme: ${THEME_MODULES[id].label}`,
        category: "Theme",
        icon: Palette,
        run: () => setTheme(id),
      })),
    ];

    if (process.env.NODE_ENV === "development") {
      extraCommands.push({
        id: "dev-seed-mock-workspace",
        label: "Dev: Seed 2,000 Mock Files (perf test)",
        category: "Developer",
        icon: Database,
        run: () => seedMockWorkspace(2000, 200),
      });
    }

    return [...shortcutCommands, ...extraCommands];
  }, [setTheme]);

  const groupedCommands = useMemo(() => groupByCategory(commands), [commands]);

  function handleSelect(cmd: PaletteCommand) {
    setOpen(false);
    cmd.run();
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command…" />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        {groupedCommands.map(([category, categoryCommands], i) => (
          <Fragment key={category}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {categoryCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={cmd.id}
                    value={`${cmd.label} ${cmd.category}`}
                    onSelect={() => handleSelect(cmd)}
                  >
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span>{cmd.label}</span>
                    {cmd.shortcut && (
                      <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
