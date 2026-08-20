"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { EditorTabs } from "./EditorTabs";
import { MonacoEditorWrapper } from "./MonacoEditorWrapper";
import { SplitEditor } from "./SplitEditor";
import { DiffTabView } from "./DiffTabView";
import { EditorWelcome } from "./EditorWelcome";
import { SkeletonText } from "@/components/ui/skeleton";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useTabsStore } from "@/store/tabsStore";
import { useUIStore } from "@/store/uiStore";
import { useDiffViewStore } from "@/store/diffViewStore";
import { useMarkdownFullPageViewStore } from "@/store/markdownFullPageViewStore";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

// DOMPurify (used to sanitize the rendered markdown) needs `window` — same ssr:false pattern
// already used for Monaco itself.
const MarkdownPreview = dynamic(() => import("./MarkdownPreview").then((m) => m.MarkdownPreview), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading preview…</div>
  ),
});
const MarkdownFullPageView = dynamic(
  () => import("./MarkdownFullPageView").then((m) => m.MarkdownFullPageView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading preview…</div>
    ),
  },
);

export function EditorArea() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const splitView = useTabsStore((s) => s.splitView);
  const setSplitView = useTabsStore((s) => s.setSplitView);
  const isSplitView = useUIStore((s) => s.isSplitView);
  const diffView = useDiffViewStore((s) => s.diffView);
  const markdownFullPageFileId = useMarkdownFullPageViewStore((s) => s.fileId);
  const markdownPreviewVisible = useUIStore((s) => s.markdownPreviewVisible);
  const authStatus = useAuthStore((s) => s.status);
  const workspaceReady = useAuthStore((s) => s.workspaceReady);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeNode = useWorkspaceStore((s) => (activeTab ? s.nodes[activeTab.fileId] : undefined));
  const showMarkdownPreview =
    markdownPreviewVisible &&
    !isSplitView &&
    activeNode?.type === "file" &&
    activeNode.language === "markdown" &&
    !activeNode.locked;
  // Until this resolves, `tabs` may still be a frozen pre-login snapshot (guest mode's
  // localStorage write-freeze while authenticated) that doesn't match which repo reads will
  // hit — rendering it early can try to load a stale id against the wrong backend and 404.
  const workspaceLoading = authStatus === "loading" || (authStatus === "authenticated" && !workspaceReady);

  useEffect(() => {
    if (workspaceLoading || !isSplitView || splitView || tabs.length === 0 || !activeTabId) return;
    const other = tabs.find((t) => t.id !== activeTabId) ?? tabs[0];
    setSplitView({ leftTabId: activeTabId, rightTabId: other.id });
  }, [workspaceLoading, isSplitView, splitView, tabs, activeTabId, setSplitView]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Markdown Full Page View has its own complete header (filename, Edit/Download PDF/Close)
          and isn't a regular open tab, so the tab strip would only render as an empty bar above it. */}
      {!markdownFullPageFileId && <EditorTabs />}
      <div className="min-h-0 flex-1">
        {workspaceLoading ? (
          <div className="animate-in fade-in h-full px-4 py-3 duration-150">
            <SkeletonText lines={10} />
          </div>
        ) : diffView ? (
          <DiffTabView diff={diffView} />
        ) : markdownFullPageFileId ? (
          <MarkdownFullPageView key={markdownFullPageFileId} fileId={markdownFullPageFileId} />
        ) : tabs.length === 0 || !activeTab ? (
          <EditorWelcome />
        ) : isSplitView && splitView ? (
          <SplitEditor split={splitView} />
        ) : (
          // Always the same ResizablePanelGroup shape — the markdown preview panel is purely
          // additive (react-resizable-panels redistributes space when a panel is added/removed)
          // so MonacoEditorWrapper's tree position never changes and it's never remounted,
          // whether toggling preview on/off or switching between markdown and non-markdown tabs.
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel defaultSize={showMarkdownPreview ? "50%" : "100%"} minSize="20%">
              <MonacoEditorWrapper
                key="primary-pane"
                fileId={activeTab.fileId}
                tabId={activeTab.id}
                registerGlobalActions
              />
            </ResizablePanel>
            {showMarkdownPreview && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize="50%" minSize="20%">
                  <MarkdownPreview key={activeTab.fileId} fileId={activeTab.fileId} />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
