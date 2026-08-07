"use client";

import { useEffect, useMemo, useState } from "react";
import { getActiveRepository } from "@/services/storage/activeRepository";
import { useMarkdownPreviewContentStore } from "@/store/markdownPreviewContentStore";
import { renderMarkdown } from "@/lib/markdown/renderMarkdown";

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
    <div className="np-scrollbar h-full overflow-auto bg-background px-6 py-4">
      <div className="np-markdown-preview mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
