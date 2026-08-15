"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { X, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonText } from "@/components/ui/skeleton";
import { LoadFailure } from "@/components/ui/load-failure";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { handleMonacoBeforeMount } from "@/lib/monaco/setupMonaco";
import { THEME_MODULES } from "@/lib/monaco/themes";
import { useSettingsStore } from "@/store/settingsStore";
import { useTabsStore } from "@/store/tabsStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useDiffViewStore, type DiffView } from "@/store/diffViewStore";
import { getActiveRepository } from "@/services/storage/activeRepository";
import * as modelRegistry from "@/lib/monaco/modelRegistry";

const MonacoDiffEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.DiffEditor), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading diff editor…</div>
  ),
});

/** Reads a tab's current content for the diff: the live (possibly-unsaved) Monaco model if this
 *  file already has one registered, otherwise the last-saved content from disk. */
async function readTabContent(fileId: string): Promise<string> {
  const existing = modelRegistry.getModel(fileId);
  if (existing) return existing.getValue();
  return getActiveRepository().readFileContent(fileId);
}

/** Renders two open tabs side by side on Monaco's own diff editor, replacing the normal tab
 *  content — no separate dialog. Reached via the Tools menu, a tab's "Compare with Active Tab"
 *  context-menu item, or the toolbar's Diff Checker button. */
export function DiffTabView({ diff }: { diff: DiffView }) {
  const theme = useSettingsStore((s) => s.theme);
  const tabs = useTabsStore((s) => s.tabs);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const closeDiff = useDiffViewStore((s) => s.closeDiff);
  const swapDiff = useDiffViewStore((s) => s.swapDiff);
  const isMobile = useIsMobile();

  const leftTab = tabs.find((t) => t.id === diff.leftTabId);
  const rightTab = tabs.find((t) => t.id === diff.rightTabId);
  const leftNode = leftTab ? nodes[leftTab.fileId] : undefined;
  const rightNode = rightTab ? nodes[rightTab.fileId] : undefined;

  const [result, setResult] = useState<{
    leftTabId: string;
    rightTabId: string;
    original: string;
    modified: string;
  } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!leftTab || !rightTab) return;
    let cancelled = false;
    void Promise.all([readTabContent(leftTab.fileId), readTabContent(rightTab.fileId)])
      .then(([original, modified]) => {
        if (!cancelled) setResult({ leftTabId: leftTab.id, rightTabId: rightTab.id, original, modified });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [leftTab, rightTab, reloadNonce]);

  // Only trust `result` while it matches the pair currently being compared — keeps stale content
  // from a previous pairing showing while the new one is still loading.
  const content = result && leftTab && rightTab && result.leftTabId === leftTab.id && result.rightTabId === rightTab.id ? result : null;

  if (!leftTab || !rightTab || !leftNode || !rightNode) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <p>One of the compared tabs was closed.</p>
        <Button size="sm" variant="outline" onClick={closeDiff}>
          <X className="size-3.5" /> Close Diff
        </Button>
      </div>
    );
  }

  const lockedNode = [leftNode, rightNode].find((n) => n.type === "file" && n.locked);
  if (lockedNode) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <p>&ldquo;{lockedNode.name}&rdquo; is locked — unlock it first to compare.</p>
        <Button size="sm" variant="outline" onClick={closeDiff}>
          <X className="size-3.5" /> Close Diff
        </Button>
      </div>
    );
  }

  const language = leftNode.type === "file" ? leftNode.language : "plaintext";
  const themeModule = THEME_MODULES[theme];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-[var(--np-toolbar-bg)] px-2.5 text-sm">
        <span className="truncate font-medium">{leftNode.name}</span>
        <ArrowLeftRight className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{rightNode.name}</span>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button size="sm" variant="ghost" onClick={swapDiff} title="Swap sides">
            <ArrowLeftRight className="size-3.5" />
            <span className="hidden sm:inline">Swap</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={closeDiff} title="Close Diff">
            <X className="size-3.5" />
            <span className="hidden sm:inline">Close Diff</span>
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {error ? (
          <LoadFailure
            error={error}
            onRetry={() => {
              setError(null);
              setReloadNonce((n) => n + 1);
            }}
          />
        ) : content ? (
          <MonacoDiffEditor
            original={content.original}
            modified={content.modified}
            language={language}
            theme={themeModule.monacoThemeId}
            beforeMount={handleMonacoBeforeMount}
            options={{
              readOnly: false,
              // Two panes don't fit on a phone — Monaco's inline mode stacks the diff instead.
              renderSideBySide: !isMobile,
              minimap: { enabled: false },
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="animate-in fade-in grid h-full grid-cols-1 gap-4 px-4 py-3 duration-150 sm:grid-cols-2">
            <SkeletonText lines={9} />
            <SkeletonText lines={9} className="hidden sm:block" />
          </div>
        )}
      </div>
    </div>
  );
}
