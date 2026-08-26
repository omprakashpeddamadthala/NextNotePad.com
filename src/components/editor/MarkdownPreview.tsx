"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Maximize2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderPane } from "./MarkdownRenderPane";
import { getActiveRepository } from "@/services/storage/activeRepository";
import { useMarkdownPreviewContentStore } from "@/store/markdownPreviewContentStore";
import { renderMarkdown } from "@/lib/markdown/renderMarkdown";
import { openMarkdownFullPage } from "@/services/markdownFullPageView";

interface MarkdownPreviewProps {
  fileId: string;
}

/** Live-rendered read-only preview of the active markdown file, shown beside the editor.
 *  Fetches once for the initial paint, then prefers the editor's live content (pushed by
 *  `MonacoEditorWrapper` on every keystroke) once available — so it updates as you type.
 *  Callers must render this with `key={fileId}` so switching files remounts it fresh instead
 *  of needing an effect to reset state (which the React Compiler flags as cascading renders). */
export function MarkdownPreview({ fileId }: MarkdownPreviewProps) {
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const liveFileId = useMarkdownPreviewContentStore((s) => s.fileId);
  const liveContent = useMarkdownPreviewContentStore((s) => s.content);

  useEffect(() => {
    let cancelled = false;
    void getActiveRepository()
      .readFileContent(fileId)
      .then((content) => {
        if (!cancelled) setInitialContent(content);
      })
      // Previously uncaught: a failed read escaped as an unhandled rejection (surfacing as a
      // "Failed to fetch" runtime overlay) and left this pane on "Loading preview…" indefinitely.
      .catch((err: unknown) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId, reloadNonce]);

  const retry = useCallback(() => {
    setError(null);
    setReloadNonce((n) => n + 1);
  }, []);

  const isLive = liveFileId === fileId;
  const content = isLive ? liveContent : initialContent;
  const html = useMemo(() => renderMarkdown(content ?? ""), [content]);

  if (error && !isLive) {
    return <MarkdownRenderPane state="error" error={error} onRetry={retry} />;
  }

  if (content === null) {
    return (
      <MarkdownRenderPane
        state="loading"
        skeletonBodyLines={6}
        onRetry={retry}
        className="h-full bg-background px-6 py-4"
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 shrink-0 items-center justify-end gap-0.5 border-b bg-[var(--np-toolbar-bg)] px-2 sm:gap-1">
        <Button size="sm" variant="ghost" onClick={() => window.print()} title="Download PDF">
          <Printer className="size-3.5" />
          <span className="hidden sm:inline">Download PDF</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => openMarkdownFullPage(fileId)} title="View Full Page">
          <Maximize2 className="size-3.5" />
          <span className="hidden sm:inline">View Full Page</span>
        </Button>
      </div>
      <div className="np-scrollbar min-h-0 flex-1 overflow-auto bg-background px-6 py-4">
        <MarkdownRenderPane state="ready" html={html} onRetry={retry} />
      </div>
    </div>
  );
}
