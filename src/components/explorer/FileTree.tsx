"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TreeNode } from "./TreeNode";
import { flattenVisibleTree } from "@/lib/utils/treeUtils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useExplorerSelectionStore } from "@/store/explorerSelectionStore";
import { useTabsStore } from "@/store/tabsStore";
import { moveNode } from "@/services/fileOperations";

const ROW_HEIGHT = 24;

export function FileTree() {
  const nodes = useWorkspaceStore((s) => s.nodes);
  const filterQuery = useWorkspaceStore((s) => s.filterQuery);
  const toggleCollapsed = useWorkspaceStore((s) => s.toggleCollapsed);
  const selectedNodeId = useExplorerSelectionStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useExplorerSelectionStore((s) => s.setSelectedNodeId);
  const draggedNodeId = useExplorerSelectionStore((s) => s.draggedNodeId);
  const setDraggedNodeId = useExplorerSelectionStore((s) => s.setDraggedNodeId);
  const dropTargetId = useExplorerSelectionStore((s) => s.dropTargetId);
  const setDropTargetId = useExplorerSelectionStore((s) => s.setDropTargetId);
  const openTab = useTabsStore((s) => s.openTab);

  const rows = flattenVisibleTree(nodes, filterQuery);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  function handleKeyDown(e: React.KeyboardEvent) {
    const index = rows.findIndex((r) => r.node.id === selectedNodeId);
    if (index === -1) return;
    const row = rows[index];

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = rows[Math.min(index + 1, rows.length - 1)];
      if (next) setSelectedNodeId(next.node.id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = rows[Math.max(index - 1, 0)];
      if (prev) setSelectedNodeId(prev.node.id);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (row.node.type === "folder" && row.node.collapsed) toggleCollapsed(row.node.id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (row.node.type === "folder" && !row.node.collapsed) {
        toggleCollapsed(row.node.id);
      } else if (row.node.parentId) {
        setSelectedNodeId(row.node.parentId);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (row.node.type === "folder") toggleCollapsed(row.node.id);
      else openTab(row.node.id);
    }
  }

  return (
    <div
      ref={parentRef}
      role="tree"
      aria-label="File explorer"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="np-scrollbar h-full flex-1 overflow-y-auto outline-none"
      onDragOver={(e) => {
        if (rows.length === 0) {
          e.preventDefault();
          setDropTargetId("root");
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("text/plain") || draggedNodeId;
        setDraggedNodeId(null);
        setDropTargetId(null);
        if (draggedId) moveNode(draggedId, null);
      }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.node.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: ROW_HEIGHT,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <TreeNode node={row.node} depth={row.depth} />
            </div>
          );
        })}
      </div>
      {rows.length === 0 && (
        <div
          className={`flex h-24 items-center justify-center rounded-sm border-2 border-dashed text-xs text-muted-foreground ${
            dropTargetId === "root" ? "border-primary" : "border-transparent"
          }`}
        >
          No files yet — right-click to create one.
        </div>
      )}
    </div>
  );
}
