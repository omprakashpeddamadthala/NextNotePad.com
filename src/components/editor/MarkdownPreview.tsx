"use client";

import { useEffect, useMemo, useState } from "react";
import { Maximize2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const liveFileId = useMarkdownPreviewContentStore((s) => s.fileId);
  const liveContent = useMarkdownPreviewContentStore((s) => s.content);

  useEffect(() => {
    let cancelled = false;
    void getActiveRepository()
      .readFileContent(fileId)
      .then((content) => {
        if (!cancelled) setInitialContent(content);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const isLive = liveFileId === fileId;
  const content = isLive ? liveContent : initialContent;
  const html = useMemo(() => renderMarkdown(content ?? ""), [content]);

  if (content === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading preview…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 shrink-0 items-center justify-end gap-1 border-b bg-[var(--np-toolbar-bg)] px-2">
        <Button size="sm" variant="ghost" onClick={() => window.print()}>
          <Printer className="size-3.5" /> Download PDF
        </Button>
        <Button size="sm" variant="ghost" onClick={() => openMarkdownFullPage(fileId)}>
          <Maximize2 className="size-3.5" /> View Full Page
        </Button>
      </div>
      <div className="np-scrollbar min-h-0 flex-1 overflow-auto bg-background px-6 py-4">
        <div className="np-markdown-preview np-print-target mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
