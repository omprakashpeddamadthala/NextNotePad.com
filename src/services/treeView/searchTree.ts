import { isContainer, type TreeNode } from "./treeModel";

export interface TreeSearch {
  query: string;
  keys: boolean;
  values: boolean;
}

export interface SearchResult {
  /** Matching node ids in document order. */
  matches: string[];
  /** Ancestors of matches: opened so every match is visible. */
  ancestors: Set<string>;
}

function keyMatches(node: TreeNode, q: string): boolean {
  return node.key.toLowerCase().includes(q);
}

function valueMatches(node: TreeNode, q: string): boolean {
  return node.value !== undefined && node.value.toLowerCase().includes(q);
}

/** Case-insensitive search over keys and/or values. */
export function searchTree(root: TreeNode, search: TreeSearch): SearchResult {
  const q = search.query.trim().toLowerCase();
  const matches: string[] = [];
  const ancestors = new Set<string>();
  if (!q || (!search.keys && !search.values)) return { matches, ancestors };

  const walk = (node: TreeNode, parents: string[]) => {
    if ((search.keys && keyMatches(node, q)) || (search.values && valueMatches(node, q))) {
      matches.push(node.id);
      for (const id of parents) ancestors.add(id);
    }
    if (node.children) for (const child of node.children) walk(child, [...parents, node.id]);
  };
  walk(root, []);
  return { matches, ancestors };
}

export interface VisibleRow {
  node: TreeNode;
  depth: number;
}

/**
 * The rows to draw: open containers show their children. With `onlyIds`,
 * rows outside that set are hidden (used by "Only matches").
 */
export function visibleRows(root: TreeNode, expanded: ReadonlySet<string>, onlyIds?: ReadonlySet<string>): VisibleRow[] {
  const rows: VisibleRow[] = [];
  const walk = (node: TreeNode, depth: number) => {
    if (onlyIds && !onlyIds.has(node.id)) return;
    rows.push({ node, depth });
    if (node.children && expanded.has(node.id)) for (const child of node.children) walk(child, depth + 1);
  };
  walk(root, 0);
  return rows;
}

/** Ids of every container at depth < level (level 0 = nothing open). */
export function containerIdsToLevel(root: TreeNode, level: number): Set<string> {
  const ids = new Set<string>();
  const walk = (node: TreeNode, depth: number) => {
    if (!isContainer(node) || depth >= level) return;
    ids.add(node.id);
    for (const child of node.children!) walk(child, depth + 1);
  };
  walk(root, 0);
  return ids;
}

export function findNode(root: TreeNode, id: string): TreeNode | undefined {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    if (id === child.id || id.startsWith(child.id)) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return undefined;
}
