"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { SkeletonText } from "@/components/ui/skeleton";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { copyNote, readNoteContent } from "@/services/copyNote";

interface MobileReadViewProps {
  fileId: string;
}

/** Plain-text reading view for phones: wrapped text that selects with a normal long-press. */
export function MobileReadView({ fileId }: MobileReadViewProps) {
  const name = useWorkspaceStore((s) => s.nodes[fileId]?.name ?? "");
  const [content, setContent] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void readNoteContent(fileId)
      .then((c) => {
        if (!cancelled) setContent(c);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  if (failed) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center px-6 text-center text-sm">
        Couldn&apos;t load this note. Switch to Edit and try again.
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="px-5 py-4">
        <SkeletonText lines={10} />
      </div>
    );
  }

  const lineCount = content === "" ? 0 : content.split("\n").length;

  return (
    <article
      aria-label={`Reading ${name}`}
      className="np-scrollbar animate-in fade-in h-full overflow-y-auto duration-200"
    >
      <div className="mx-auto max-w-2xl px-5 pt-5 pb-10">
        <div className="text-muted-foreground mb-4 flex items-center justify-between gap-3 text-[11px] font-medium tracking-wide uppercase">
          <span>
            {lineCount} line{lineCount === 1 ? "" : "s"} · {content.length}{" "}
            characters
          </span>
          <button
            type="button"
            onClick={() => void copyNote(fileId)}
            className="text-primary active:bg-primary/10 flex items-center gap-1 rounded-full px-2.5 py-1 normal-case transition-colors duration-150"
          >
            <Copy className="size-3.5" />
            Copy all
          </button>
        </div>
        {content === "" ? (
          <p className="text-muted-foreground text-sm">This note is empty.</p>
        ) : (
          <div className="text-foreground text-[15px] leading-7 break-words whitespace-pre-wrap select-text">
            {content}
          </div>
        )}
      </div>
    </article>
  );
}
