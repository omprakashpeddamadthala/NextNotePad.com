"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Pencil, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonText } from "@/components/ui/skeleton";
import { LoadFailure } from "@/components/ui/load-failure";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useMarkdownFullPageViewStore } from "@/store/markdownFullPageViewStore";
import { getActiveRepository } from "@/services/storage/activeRepository";
import * as modelRegistry from "@/lib/monaco/modelRegistry";
import { renderMarkdown } from "@/lib/markdown/renderMarkdown";

/** Reads a file's current content for read-only display: the live (possibly-unsaved) Monaco
 *  model if one's still registered, otherwise the last-saved content from storage. Mirrors
 *  DiffTabView's `readTabContent`. */
async function readCurrentContent(fileId: string): Promise<string> {
  const existing = modelRegistry.getModel(fileId);
  if (existing) return existing.getValue();
  return getActiveRepository().readFileContent(fileId);
}

/** Full-page, read-only rendering of a markdown file — replaces the tab content the same way
 *  DiffTabView does. This is the default landing view for a markdown file (the explorer opens it
 *  straight here instead of the editor); it's also reached from the side-by-side preview's "View
 *  Full Page" button. The Edit button opens the normal editor tab for anyone who wants to type.
 *  Printing (for "Save as PDF") isolates the `.np-print-target` content via the print stylesheet
 *  in themes.css, so only the rendered markdown ends up on the page, not the app chrome around it.
 *  Callers must render this with `key={fileId}` so switching files remounts it fresh instead of
 *  needing an effect to reset state — same convention as MarkdownPreview. */
export function MarkdownFullPageView({ fileId }: { fileId: string }) {
  const closeFullPage = useMarkdownFullPageViewStore((s) => s.closeFullPage);
  const openTab = useTabsStore((s) => s.openTab);
  const addRecent = useRecentFilesStore((s) => s.addRecent);
  const node = useWorkspaceStore((s) => s.nodes[fileId]);

  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  function handleEdit() {
    openTab(fileId);
    addRecent(fileId);
    closeFullPage();
  }

  useEffect(() => {
    let cancelled = false;
    void readCurrentContent(fileId)
      .then((c) => {
        if (!cancelled) setContent(c);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId, reloadNonce]);

  const html = useMemo(() => renderMarkdown(content ?? ""), [content]);

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <p>That file isn&rsquo;t open anymore.</p>
        <Button size="sm" variant="outline" onClick={closeFullPage}>
          <X className="size-3.5" /> Close
        </Button>
      </div>
    );
  }

  if (node.type === "file" && node.locked) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <p>&ldquo;{node.name}&rdquo; is locked — unlock it first to view it.</p>
        <Button size="sm" variant="outline" onClick={closeFullPage}>
          <X className="size-3.5" /> Close
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-[var(--np-toolbar-bg)] px-2.5 text-sm">
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{node.name}</span>
        {/* Labels collapse to icons on narrow screens so the filename keeps room to breathe —
            the title attribute keeps each button identifiable once its text is hidden. */}
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button size="sm" variant="ghost" onClick={handleEdit} title="Edit">
            <Pencil className="size-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={content === null || error !== null}
            onClick={() => window.print()}
            title="Download PDF"
          >
            <Printer className="size-3.5" />
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={closeFullPage} title="Close">
            <X className="size-3.5" />
            <span className="hidden sm:inline">Close</span>
          </Button>
        </div>
      </div>
      <div className="np-scrollbar h-full overflow-auto bg-background px-6 py-4">
        {error ? (
          <LoadFailure
            error={error}
            onRetry={() => {
              setError(null);
              setReloadNonce((n) => n + 1);
            }}
          />
        ) : content === null ? (
          <div className="animate-in fade-in mx-auto max-w-3xl space-y-4 duration-150">
            <SkeletonText lines={2} className="max-w-[55%]" />
            <SkeletonText lines={8} />
          </div>
        ) : (
          <div
            className="np-markdown-preview np-print-target animate-in fade-in mx-auto max-w-3xl duration-200"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
