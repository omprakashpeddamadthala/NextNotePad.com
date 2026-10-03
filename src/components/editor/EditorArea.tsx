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
import { useAdminViewStore } from "@/store/adminViewStore";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

// DOMPurify (used to sanitize the rendered markdown) needs `window`
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
const AdminView = dynamic(() => import("@/components/admin/AdminView").then((m) => m.AdminView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
  ),
});

export function EditorArea() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const splitView = useTabsStore((s) => s.splitView);
  const setSplitView = useTabsStore((s) => s.setSplitView);
  const isSplitView = useUIStore((s) => s.isSplitView);
  const diffView = useDiffViewStore((s) => s.diffView);
  const markdownFullPageFileId = useMarkdownFullPageViewStore((s) => s.fileId);
  const adminViewOpen = useAdminViewStore((s) => s.isOpen);
  const markdownPreviewVisible = useUIStore((s) => s.markdownPreviewVisible);
  const markdownEditingFileIds = useUIStore((s) => s.markdownEditingFileIds);
  const setMarkdownEditing = useUIStore((s) => s.setMarkdownEditing);
  const authStatus = useAuthStore((s) => s.status);
  const workspaceReady = useAuthStore((s) => s.workspaceReady);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeNode = useWorkspaceStore((s) => (activeTab ? s.nodes[activeTab.fileId] : undefined));
  const isMarkdown =
    activeNode?.type === "file" &&
    (activeNode.language === "markdown" ||
      activeNode.name.toLowerCase().endsWith(".md") ||
      activeNode.name.toLowerCase().endsWith(".markdown"));

  const isEditingMarkdown = activeTab ? Boolean(markdownEditingFileIds[activeTab.fileId]) : false;

  const showMarkdownPreview =
    markdownPreviewVisible &&
    !isSplitView &&
    isMarkdown &&
    isEditingMarkdown &&
    !activeNode.locked;

  const workspaceLoading = authStatus === "loading" || (authStatus === "authenticated" && !workspaceReady);

  useEffect(() => {
    if (workspaceLoading || !isSplitView || splitView || tabs.length === 0 || !activeTabId) return;
    const other = tabs.find((t) => t.id !== activeTabId) ?? tabs[0];
    setSplitView({ leftTabId: activeTabId, rightTabId: other.id });
  }, [workspaceLoading, isSplitView, splitView, tabs, activeTabId, setSplitView]);

  useEffect(() => {
    if (!splitView || !activeTabId) return;
    if (
      splitView.leftTabId === activeTabId ||
      splitView.rightTabId === activeTabId
    )
      return;
    setSplitView({ leftTabId: activeTabId, rightTabId: splitView.rightTabId });
  }, [activeTabId, splitView, setSplitView]);

  return (
    <div
      id="editor-main"
      role="main"
      aria-label="Editor"
      tabIndex={-1}
      className="flex h-full min-h-0 flex-col outline-none"
    >
      {!adminViewOpen && <EditorTabs />}
      <div className="min-h-0 flex-1">
        {adminViewOpen ? (
          <AdminView />
        ) : workspaceLoading ? (
          <div className="animate-in fade-in h-full px-4 py-3 duration-150">
            <SkeletonText lines={10} />
          </div>
        ) : diffView ? (
          <DiffTabView diff={diffView} />
        ) : markdownFullPageFileId &&
          activeTab?.fileId === markdownFullPageFileId ? (
          <MarkdownFullPageView
            key={markdownFullPageFileId}
            fileId={markdownFullPageFileId}
            showClose
          />
        ) : tabs.length === 0 || !activeTab ? (
          <EditorWelcome />
        ) : isMarkdown && !isEditingMarkdown ? (
          /* All MD files show directly in the MD viewer with the full page */
          <MarkdownFullPageView
            key={activeTab.fileId}
            fileId={activeTab.fileId}
            onEdit={() => setMarkdownEditing(activeTab.fileId, true)}
            showClose={false}
          />
        ) : isSplitView && splitView ? (
          <SplitEditor split={splitView} />
        ) : (
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
