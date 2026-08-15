"use client";

import { useMemo } from "react";
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
  Code2,
  CaseSensitive,
  Hash,
  FileDiff,
  KeyRound,
  Fingerprint,
  FileText,
  Lock,
  Clock,
  Link as LinkIcon,
  Regex,
  FileJson,
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
        id: "tools-html-entity-encode",
        label: "Tools: HTML Entity Encode",
        category: "Tools",
        icon: Code2,
        run: () => runAction("tools.htmlEntityEncode"),
      },
      {
        id: "tools-html-entity-decode",
        label: "Tools: HTML Entity Decode",
        category: "Tools",
        icon: Code2,
        run: () => runAction("tools.htmlEntityDecode"),
      },
      {
        id: "tools-jwt-decode",
        label: "Tools: JWT Decode",
        category: "Tools",
        icon: KeyRound,
        run: () => runAction("tools.jwtDecode"),
      },
      {
        id: "tools-uuid-generate",
        label: "Tools: UUID Generator",
        category: "Tools",
        icon: Fingerprint,
        run: () => runAction("tools.uuidGenerate"),
      },
      {
        id: "tools-lorem-ipsum",
        label: "Tools: Lorem Ipsum Generator",
        category: "Tools",
        icon: FileText,
        run: () => runAction("tools.loremIpsum"),
      },
      {
        id: "tools-random-password",
        label: "Tools: Random Password Generator",
        category: "Tools",
        icon: Lock,
        run: () => runAction("tools.randomPassword"),
      },
      {
        id: "tools-timestamp-convert",
        label: "Tools: Timestamp ↔ Date Converter",
        category: "Tools",
        icon: Clock,
        run: () => runAction("tools.timestampConvert"),
      },
      {
        id: "tools-color-convert",
        label: "Tools: Color Converter",
        category: "Tools",
        icon: Palette,
        run: () => runAction("tools.colorConvert"),
      },
      {
        id: "tools-slug-generate",
        label: "Tools: Slugify",
        category: "Tools",
        icon: LinkIcon,
        run: () => runAction("tools.slugGenerate"),
      },
      {
        id: "tools-diff-checker",
        label: "Tools: Diff Checker",
        category: "Tools",
        icon: FileDiff,
        run: () => runAction("tools.diffChecker"),
      },
      {
        id: "tools-regex-tester",
        label: "Tools: Regex Tester",
        category: "Tools",
        icon: Regex,
        run: () => runAction("tools.regexTester"),
      },
      {
        id: "tools-json-converter",
        label: "Tools: JSON Converter (CSV/YAML)",
        category: "Tools",
        icon: FileJson,
        run: () => runAction("tools.jsonConverter"),
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

  function handleSelect(cmd: PaletteCommand) {
    setOpen(false);
    cmd.run();
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command…" />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Commands">
          {commands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <CommandItem key={cmd.id} value={`${cmd.label} ${cmd.category}`} onSelect={() => handleSelect(cmd)}>
                {Icon && <Icon className="size-4 shrink-0" />}
                <span>{cmd.label}</span>
                {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
