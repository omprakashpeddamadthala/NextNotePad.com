"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, FileText, Pencil, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MarkdownRenderPane } from "./MarkdownRenderPane";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useTabsStore } from "@/store/tabsStore";
import { useRecentFilesStore } from "@/store/recentFilesStore";
import { useMarkdownFullPageViewStore } from "@/store/markdownFullPageViewStore";
import { useUIStore } from "@/store/uiStore";
import { getActiveRepository } from "@/services/storage/activeRepository";
import * as modelRegistry from "@/lib/monaco/modelRegistry";
import { renderMarkdown } from "@/lib/markdown/renderMarkdown";

interface MarkdownFullPageViewProps {
  fileId: string;
  onEdit?: () => void;
  showClose?: boolean;
}

async function readCurrentContent(fileId: string): Promise<string> {
  const existing = modelRegistry.getModel(fileId);
  if (existing) return existing.getValue();
  return getActiveRepository().readFileContent(fileId);
}

export function MarkdownFullPageView({
  fileId,
  onEdit,
  showClose = false,
}: MarkdownFullPageViewProps) {
  const closeFullPage = useMarkdownFullPageViewStore((s) => s.closeFullPage);
  const openTab = useTabsStore((s) => s.openTab);
  const addRecent = useRecentFilesStore((s) => s.addRecent);
  const setMarkdownEditing = useUIStore((s) => s.setMarkdownEditing);
  const node = useWorkspaceStore((s) => s.nodes[fileId]);

  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Entire Markdown file copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy Markdown content");
    }
  }

  function handleEdit() {
    if (onEdit) {
      onEdit();
    } else {
      setMarkdownEditing(fileId, true);
      openTab(fileId);
      addRecent(fileId);
      closeFullPage();
    }
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

  const words = useMemo(() => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const readTimeMin = useMemo(() => Math.max(1, Math.ceil(words / 200)), [words]);

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
    <div className="flex h-full w-full flex-col select-text overflow-hidden bg-background">
      <div className="flex h-9 shrink-0 items-center justify-between border-b bg-[var(--np-toolbar-bg)] px-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="size-3.5 shrink-0 text-primary" />
          <span className="truncate font-semibold text-foreground">{node.name}</span>
          <span className="hidden sm:inline-flex rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
            MD Viewer
          </span>
          <span className="hidden md:inline text-muted-foreground/60 text-[11px]">
            {words} words • {readTimeMin} min read
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 px-2.5 text-xs font-medium cursor-pointer border-border/70 hover:bg-accent/60"
            onClick={handleEdit}
            title="Edit Markdown Source (Raw)"
          >
            <Pencil className="size-3 text-primary" />
            <span>Edit Source</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 px-2.5 text-xs font-medium cursor-pointer border-border/70 hover:bg-accent/60"
            disabled={content === null || error !== null}
            onClick={handleCopy}
            title="Entire MD file to copy"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3 text-primary" />
            )}
            <span>{copied ? "Copied" : "Copy MD"}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent/60"
            disabled={content === null || error !== null}
            onClick={() => window.print()}
            title="Download PDF / Print"
          >
            <Printer className="size-3" />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          {showClose && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={closeFullPage}
              title="Close Full Page"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="np-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 w-full">
        <MarkdownRenderPane
          state={error ? "error" : content === null ? "loading" : "ready"}
          error={error}
          html={html}
          skeletonBodyLines={8}
          centered={false}
          className="w-full max-w-none"
          onRetry={() => {
            setError(null);
            setReloadNonce((n) => n + 1);
          }}
        />
      </div>
    </div>
  );
}
