"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Maximize2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderPane } from "./MarkdownRenderPane";
import { getActiveRepository } from "@/services/storage/activeRepository";
import { useMarkdownPreviewContentStore } from "@/store/markdownPreviewContentStore";
import { renderMarkdown } from "@/lib/markdown/renderMarkdown";
import { openMarkdownFullPage } from "@/services/markdownFullPageView";

import * as modelRegistry from "@/lib/monaco/modelRegistry";

interface MarkdownPreviewProps {
  fileId: string;
}

export function MarkdownPreview({ fileId }: MarkdownPreviewProps) {
  const [initialContent, setInitialContent] = useState<string | null>(() => {
    const existing = modelRegistry.getModel(fileId);
    return existing ? existing.getValue() : null;
  });
  const [error, setError] = useState<unknown>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const liveFileId = useMarkdownPreviewContentStore((s) => s.fileId);
  const liveContent = useMarkdownPreviewContentStore((s) => s.content);

  useEffect(() => {
    let cancelled = false;
    const existing = modelRegistry.getModel(fileId);
    if (existing) {
      Promise.resolve().then(() => {
        if (!cancelled) setInitialContent(existing.getValue());
      });
      return;
    }
    void getActiveRepository()
      .readFileContent(fileId)
      .then((content) => {
        if (!cancelled) setInitialContent(content);
      })
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
        className="bg-background h-full px-6 py-4"
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 shrink-0 items-center justify-end gap-0.5 border-b bg-[var(--np-toolbar-bg)] px-2 sm:gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.print()}
          title="Download PDF"
        >
          <Printer className="size-3.5" />
          <span className="hidden sm:inline">Download PDF</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => openMarkdownFullPage(fileId)}
          title="View Full Page"
        >
          <Maximize2 className="size-3.5" />
          <span className="hidden sm:inline">View Full Page</span>
        </Button>
      </div>
      <div className="np-scrollbar bg-background min-h-0 flex-1 overflow-auto p-4 sm:p-5 w-full">
        <MarkdownRenderPane
          state="ready"
          html={html}
          centered={false}
          className="w-full max-w-none"
          onRetry={retry}
        />
      </div>
    </div>
  );
}
