export type TreeNodeType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "element"
  | "attribute"
  | "text";

/** One row of the tree, the same shape for JSON, YAML and XML. */
export interface TreeNode {
  /** Unique within one tree; also the copyable path. */
  id: string;
  /** What the row shows on the left: a key, "[0]", an element name, "@attr" or "#text". */
  key: string;
  type: TreeNodeType;
  /** Display text for leaves (strings without quotes). */
  value?: string;
  children?: TreeNode[];
  /** 1-based line and column of the node in the note. */
  line: number;
  column: number;
  /** Source offsets, used by "Copy value" for whole objects and elements. */
  start: number;
  end: number;
}

export type TreeFormat = "json" | "yaml" | "xml";

export interface TreeParseError {
  message: string;
  line: number;
  column: number;
}

export type TreeParseResult =
  | { ok: true; root: TreeNode }
  | { ok: false; error: TreeParseError };

export function isContainer(node: TreeNode): boolean {
  return Boolean(node.children && node.children.length > 0);
}

/** Converts source offsets to 1-based line/column with a binary search. */
export function createLineIndex(text: string): (offset: number) => { line: number; column: number } {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: offset - starts[lo] + 1 };
  };
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** JSONPath-style child path: $.name, $["odd key"], $[3]. */
export function childPath(parent: string, key: string | number): string {
  if (typeof key === "number") return `${parent}[${key}]`;
  return IDENTIFIER.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;
}
