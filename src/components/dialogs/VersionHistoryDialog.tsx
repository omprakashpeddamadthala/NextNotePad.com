"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { ArrowLeftRight, History, LockKeyhole, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SkeletonText } from "@/components/ui/skeleton";
import { useVersionHistoryStore } from "@/store/versionHistoryStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { handleMonacoBeforeMount } from "@/lib/monaco/setupMonaco";
import { loadMonacoReact } from "@/lib/monaco/loadMonacoReact";
import { THEME_MODULES } from "@/lib/monaco/themes";
import { formatBytes } from "@/lib/utils/formatBytes";
import { readNoteContent } from "@/services/copyNote";
import {
  fetchVersionText,
  fetchVersions,
  restoreVersion,
  type NoteVersion,
} from "@/services/versionHistory";
import type { FileNode } from "@/types/file";

const MonacoDiffEditor = dynamic(
  () => loadMonacoReact().then((m) => m.DiffEditor),
  { ssr: false, loading: () => <SkeletonText lines={8} /> },
);

function formatWhen(ms: number): string {
  const date = new Date(ms);
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}, ${time}`;
}

function Message({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof History;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Icon className="text-muted-foreground size-6" />
      <p className="text-sm font-medium">{title}</p>
      {children && <div className="text-muted-foreground max-w-sm text-xs">{children}</div>}
    </div>
  );
}

function Loading() {
  return (
    <div className="p-4">
      <SkeletonText lines={10} />
    </div>
  );
}

/** Mounted fresh for each note (keyed by file id), so no state carries over. */
function VersionBrowser({ file, onDone }: { file: FileNode; onDone: () => void }) {
  const theme = useSettingsStore((s) => s.theme);
  const isMobile = useIsMobile();
  const [versions, setVersions] = useState<NoteVersion[] | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string; text: string } | null>(null);
  const [failedPreviewId, setFailedPreviewId] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // The newest entry is the note as it is now, so start on the one before it.
  const selectedId = pickedId ?? versions?.[1]?.id ?? versions?.[0]?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    fetchVersions(file.id)
      .then((list) => !cancelled && setVersions(list))
      .catch(() => !cancelled && setListFailed(true));
    return () => {
      cancelled = true;
    };
  }, [file.id]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetchVersionText(file.id, selectedId)
      .then((text) => !cancelled && setPreview({ id: selectedId, text }))
      .catch(() => !cancelled && setFailedPreviewId(selectedId));
    return () => {
      cancelled = true;
    };
  }, [file.id, selectedId]);

  useEffect(() => {
    if (!comparing) return;
    let cancelled = false;
    void readNoteContent(file.id).then((text) => !cancelled && setCurrent(text));
    return () => {
      cancelled = true;
    };
  }, [comparing, file.id]);

  if (listFailed) {
    return (
      <Message icon={History} title="Couldn't load the history">
        Check your connection and try again.
      </Message>
    );
  }
  if (versions === null) {
    return (
      <div className="grid min-h-0 flex-1 gap-4 sm:grid-cols-[16rem_1fr]">
        <SkeletonText lines={6} />
        <SkeletonText lines={10} className="hidden sm:block" />
      </div>
    );
  }
  if (versions.length === 0) {
    return (
      <Message icon={History} title="No earlier versions yet">
        Versions appear here after the note has been saved a few times.
      </Message>
    );
  }

  const isNewest = selectedId === versions[0].id;
  const previewReady = preview !== null && preview.id === selectedId;
  const previewFailed = failedPreviewId !== null && failedPreviewId === selectedId;

  async function restore() {
    if (!preview) return;
    const version = versions?.find((v) => v.id === preview.id);
    setRestoring(true);
    try {
      await restoreVersion(file.id, preview.text);
      toast.success(`Restored the version from ${version ? formatWhen(version.modifiedTime) : "earlier"}`, {
        description: "The text it replaced is still in the history.",
      });
      onDone();
    } catch {
      toast.error("Couldn't restore this version. Check your connection and try again.");
      setRestoring(false);
    }
  }

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,10rem)_minmax(0,1fr)] gap-3 sm:grid-cols-[16rem_minmax(0,1fr)] sm:grid-rows-1 sm:gap-4">
      <ul aria-label="Versions" className="np-scrollbar border-border/70 min-h-0 overflow-y-auto rounded-xl border p-1">
        {versions.map((v, i) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => setPickedId(v.id)}
              aria-current={v.id === selectedId}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ${
                v.id === selectedId ? "bg-primary/12 text-foreground" : "hover:bg-accent text-muted-foreground"
              }`}
            >
              <span className="truncate">
                {formatWhen(v.modifiedTime)}
                {i === 0 && <span className="text-primary ml-1.5 text-[11px] font-medium">Latest</span>}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums opacity-70">{formatBytes(v.size)}</span>
            </button>
          </li>
        ))}
      </ul>

      <section className="border-border/70 flex min-h-0 flex-col overflow-hidden rounded-xl border">
        <div className="border-border/60 flex items-center justify-between gap-2 border-b px-3 py-2">
          <p className="text-muted-foreground hidden truncate text-xs sm:block">
            {comparing ? "Left: this version · Right: the note now" : "Preview"}
          </p>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              disabled={!previewReady}
              onClick={() => setComparing((c) => !c)}
              aria-pressed={comparing}
            >
              <ArrowLeftRight className="size-3.5" />
              {comparing ? "Show preview" : "Compare with current"}
            </Button>
            <Button size="sm" disabled={!previewReady || isNewest || restoring} onClick={() => void restore()}>
              <RotateCcw className="size-3.5" />
              {restoring ? "Restoring…" : "Restore"}
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          {previewFailed ? (
            <Message icon={History} title="Couldn't load this version" />
          ) : !previewReady ? (
            <Loading />
          ) : comparing ? (
            current === null ? (
              <Loading />
            ) : (
              <MonacoDiffEditor
                original={preview.text}
                modified={current}
                language={file.language}
                theme={THEME_MODULES[theme].monacoThemeId}
                beforeMount={handleMonacoBeforeMount}
                // Dispose the texts only after the diff widget itself is gone; the
                // default order throws "TextModel got disposed" when the dialog closes.
                keepCurrentOriginalModel
                keepCurrentModifiedModel
                onMount={(diffEditor) => {
                  const models = diffEditor.getModel();
                  diffEditor.onDidDispose(() => {
                    models?.original.dispose();
                    models?.modified.dispose();
                  });
                }}
                options={{
                  readOnly: true,
                  originalEditable: false,
                  renderSideBySide: !isMobile,
                  minimap: { enabled: false },
                  automaticLayout: true,
                }}
              />
            )
          ) : (
            <pre className="np-scrollbar animate-in fade-in h-full overflow-auto p-4 font-mono text-[13px] leading-6 whitespace-pre-wrap duration-150">
              {preview.text || <span className="text-muted-foreground">This version is empty.</span>}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}

export function VersionHistoryDialog() {
  const fileId = useVersionHistoryStore((s) => s.fileId);
  const close = useVersionHistoryStore((s) => s.close);
  const node = useWorkspaceStore((s) => (fileId ? s.nodes[fileId] : undefined));
  const authStatus = useAuthStore((s) => s.status);
  const file = node?.type === "file" ? node : undefined;

  return (
    <Dialog open={fileId !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex h-[min(46rem,88dvh)] flex-col gap-4 sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
          <DialogDescription className="truncate">
            {file ? file.name : "Note"} · Google Drive keeps earlier versions for about 30 days
          </DialogDescription>
        </DialogHeader>

        {authStatus !== "authenticated" ? (
          <Message icon={History} title="Sign in to keep version history">
            Notes saved in your Google Drive keep their earlier versions, so you can go back after a mistake.
            <div className="mt-4">
              <Button
                size="sm"
                onClick={() => {
                  // Sign-in is a server redirect to Google, so it needs a full page load.
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.href = "/api/auth/google";
                }}
              >
                Sign in with Google
              </Button>
            </div>
          </Message>
        ) : !file ? (
          <Message icon={History} title="This note no longer exists" />
        ) : file.locked ? (
          <Message icon={LockKeyhole} title="This note is locked">
            Unlock it to see and restore earlier versions.
          </Message>
        ) : (
          <VersionBrowser key={file.id} file={file} onDone={close} />
        )}
      </DialogContent>
    </Dialog>
  );
}
