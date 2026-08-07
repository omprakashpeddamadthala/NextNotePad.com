"use client";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { MonacoEditorWrapper } from "./MonacoEditorWrapper";
import { useTabsStore } from "@/store/tabsStore";
import type { SplitView } from "@/store/tabsStore";

export function SplitEditor({ split }: { split: SplitView }) {
  const tabs = useTabsStore((s) => s.tabs);
  const leftTab = tabs.find((t) => t.id === split.leftTabId);
  const rightTab = tabs.find((t) => t.id === split.rightTabId);

  if (!leftTab || !rightTab) return null;

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel defaultSize="50%" minSize="20%">
        <MonacoEditorWrapper key="split-left" fileId={leftTab.fileId} tabId={leftTab.id} registerGlobalActions />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="50%" minSize="20%">
        <MonacoEditorWrapper key="split-right" fileId={rightTab.fileId} tabId={rightTab.id} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
