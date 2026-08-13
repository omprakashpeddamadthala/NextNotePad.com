"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { DiffOnMount } from "@monaco-editor/react";
import { ArrowLeftRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { handleMonacoBeforeMount } from "@/lib/monaco/setupMonaco";
import { THEME_MODULES } from "@/lib/monaco/themes";
import { LANGUAGES } from "@/lib/constants/languages";
import { useSettingsStore } from "@/store/settingsStore";
import { useActiveFile } from "@/hooks/useActiveFile";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import * as modelRegistry from "@/lib/monaco/modelRegistry";
import { Button } from "@/components/ui/button";

const MonacoDiffEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.DiffEditor), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading diff editor…</div>
  ),
});

/** Compares two of your open tabs side by side, on Monaco's own diff editor. The active tab loads
 *  into the left pane automatically; pick another open tab from the dropdown to load the right —
 *  no separate copy/paste step for content you already have open. Both panes stay editable. */
export function DiffCheckerTool() {
  const theme = useSettingsStore((s) => s.theme);
  const [language, setLanguage] = useState("plaintext");
  const [modifiedTabId, setModifiedTabId] = useState<string>("");
  const diffEditorRef = useRef<Parameters<DiffOnMount>[0] | null>(null);
  const { file } = useActiveFile();
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const nodes = useWorkspaceStore((s) => s.nodes);

  const otherTabs = tabs
    .filter((t) => t.id !== activeTabId)
    .map((t) => ({ tab: t, node: nodes[t.fileId] }))
    .filter((t): t is { tab: (typeof tabs)[number]; node: NonNullable<(typeof nodes)[string]> } => Boolean(t.node));

  const handleMount: DiffOnMount = (editor) => {
    diffEditorRef.current = editor;
    if (file) {
      const content = modelRegistry.getModel(file.id)?.getValue() ?? "";
      editor.getModel()?.original.setValue(content);
    }
  };

  function loadModifiedTab(tabId: string) {
    setModifiedTabId(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    const model = diffEditorRef.current?.getModel();
    if (!tab || !model) return;
    const content = modelRegistry.getModel(tab.fileId)?.getValue() ?? "";
    model.modified.setValue(content);
  }

  function swap() {
    const model = diffEditorRef.current?.getModel();
    if (!model) return;
    const originalValue = model.original.getValue();
    const modifiedValue = model.modified.getValue();
    model.original.setValue(modifiedValue);
    model.modified.setValue(originalValue);
  }

  const themeModule = THEME_MODULES[theme];

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.id} value={lang.id}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">Compare with tab:</span>
        <Select value={modifiedTabId} onValueChange={loadModifiedTab} disabled={otherTabs.length === 0}>
          <SelectTrigger size="sm" className="w-48">
            <SelectValue placeholder={otherTabs.length === 0 ? "No other tabs open" : "Choose a tab…"} />
          </SelectTrigger>
          <SelectContent>
            {otherTabs.map(({ tab, node }) => (
              <SelectItem key={tab.id} value={tab.id}>
                {node.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={swap}>
          <ArrowLeftRight className="size-3.5" /> Swap
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        <MonacoDiffEditor
          language={language}
          theme={themeModule.monacoThemeId}
          beforeMount={handleMonacoBeforeMount}
          onMount={handleMount}
          options={{ readOnly: false, renderSideBySide: true, minimap: { enabled: false }, automaticLayout: true }}
        />
      </div>
    </div>
  );
}
