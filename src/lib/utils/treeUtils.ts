import type { WorkspaceNode } from "@/types/file";
import { joinPath } from "./pathUtils";

export type NodeMap = Record<string, WorkspaceNode>;

const ROOT_PARENT_ID = null;

function getChildren(nodes: NodeMap, parentId: string | null): WorkspaceNode[] {
  const children = Object.values(nodes).filter(
    (n) => n.parentId === parentId && !n.deleted,
  );
  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  return children;
}

export interface FlatTreeRow {
  node: WorkspaceNode;
  depth: number;
}

/** Depth-first flattening of the tree, skipping children of collapsed folders — what the virtualizer
 *  renders. Hidden nodes (and everything under a hidden folder) are skipped unless `showHidden`. */
export function flattenVisibleTree(nodes: NodeMap, filterQuery = "", showHidden = false): FlatTreeRow[] {
  const rows: FlatTreeRow[] = [];
  const query = filterQuery.trim().toLowerCase();
  const matchesFilter = query
    ? (node: WorkspaceNode) => node.name.toLowerCase().includes(query)
    : null;

  function anyDescendantMatches(node: WorkspaceNode): boolean {
    if (node.type !== "folder") return matchesFilter ? matchesFilter(node) : true;
    if (matchesFilter?.(node)) return true;
    return getChildren(nodes, node.id).some((c) => (showHidden || !c.hidden) && anyDescendantMatches(c));
  }

  function walk(parentId: string | null, depth: number) {
    for (const node of getChildren(nodes, parentId)) {
      if (!showHidden && node.hidden) continue;
      if (matchesFilter && !anyDescendantMatches(node)) continue;
      rows.push({ node, depth });
      if (node.type === "folder" && (!node.collapsed || matchesFilter)) {
        walk(node.id, depth + 1);
      }
    }
  }

  walk(ROOT_PARENT_ID, 0);
  return rows;
}

export function isDescendant(nodes: NodeMap, ancestorId: string, candidateId: string): boolean {
  let current = nodes[candidateId];
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = nodes[current.parentId];
  }
  return false;
}

/** Returns id -> new path for the node and every descendant, after a rename or move. */
export function recomputeSubtreePaths(
  nodes: NodeMap,
  nodeId: string,
  newParentPath: string,
  newName: string,
): Record<string, string> {
  const patch: Record<string, string> = {};
  const newPath = joinPath(newParentPath, newName);
  patch[nodeId] = newPath;

  function walk(parentId: string, parentPath: string) {
    for (const child of getChildren(nodes, parentId)) {
      const childPath = joinPath(parentPath, child.name);
      patch[child.id] = childPath;
      if (child.type === "folder") walk(child.id, childPath);
    }
  }

  walk(nodeId, newPath);
  return patch;
}

export function collectSubtree(nodes: NodeMap, nodeId: string): WorkspaceNode[] {
  const result: WorkspaceNode[] = [];
  function walk(parentId: string) {
    for (const child of getChildren(nodes, parentId)) {
      result.push(child);
      if (child.type === "folder") walk(child.id);
    }
  }
  walk(nodeId);
  return result;
}

export function countNodes(nodes: NodeMap): { files: number; folders: number } {
  let files = 0;
  let folders = 0;
  for (const node of Object.values(nodes)) {
    if (node.deleted) continue;
    if (node.type === "file") files++;
    else folders++;
  }
  return { files, folders };
}

export function siblingNameExists(
  nodes: NodeMap,
  parentId: string | null,
  name: string,
  excludeId?: string,
): boolean {
  return getChildren(nodes, parentId).some(
    (n) => n.id !== excludeId && n.name.toLowerCase() === name.toLowerCase(),
  );
}
