import { parseTree, printParseErrorCode, type Node, type ParseError } from "jsonc-parser";
import { childPath, createLineIndex, type TreeNode, type TreeParseResult } from "./treeModel";

/** Parses JSON (comments and trailing commas allowed) into a tree with line numbers. */
export function parseJsonTree(text: string): TreeParseResult {
  const errors: ParseError[] = [];
  const root = parseTree(text, errors, { allowTrailingComma: true, disallowComments: false });
  const position = createLineIndex(text);

  if (errors.length > 0 || !root) {
    const first = errors[0];
    const at = position(first?.offset ?? 0);
    return {
      ok: false,
      error: {
        message: first ? describe(printParseErrorCode(first.error)) : "The note is empty.",
        ...at,
      },
    };
  }

  function convert(node: Node, key: string, path: string): TreeNode {
    const at = position(node.offset);
    const base = { id: path, key, line: at.line, column: at.column, start: node.offset, end: node.offset + node.length };
    switch (node.type) {
      case "object":
        return {
          ...base,
          type: "object",
          children: (node.children ?? []).map((prop) => {
            const [keyNode, valueNode] = prop.children ?? [];
            const name = String(keyNode?.value ?? "");
            const child = convert(valueNode ?? keyNode, name, childPath(path, name));
            // Point the row at the key, which is where people look for it.
            const keyAt = position(prop.offset);
            return { ...child, line: keyAt.line, column: keyAt.column };
          }),
        };
      case "array":
        return {
          ...base,
          type: "array",
          children: (node.children ?? []).map((item, i) => convert(item, `[${i}]`, childPath(path, i))),
        };
      case "string":
        return { ...base, type: "string", value: String(node.value) };
      case "number":
        return { ...base, type: "number", value: text.slice(node.offset, node.offset + node.length) };
      case "boolean":
        return { ...base, type: "boolean", value: String(node.value) };
      default:
        return { ...base, type: "null", value: "null" };
    }
  }

  return { ok: true, root: convert(root, "$", "$") };
}

/** Turns codes like "CloseBraceExpected" into "Close brace expected". */
function describe(code: string): string {
  const words = code.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
