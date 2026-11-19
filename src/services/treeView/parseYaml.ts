import { isAlias, isMap, isPair, isScalar, isSeq, parseDocument, type Node as YamlNode } from "yaml";
import { childPath, createLineIndex, type TreeNode, type TreeParseResult } from "./treeModel";

/** Parses YAML into a tree with line numbers. Only the first document is shown. */
export function parseYamlTree(text: string): TreeParseResult {
  const doc = parseDocument(text, { prettyErrors: false });
  const position = createLineIndex(text);
  if (doc.errors.length > 0) {
    const first = doc.errors[0];
    return {
      ok: false,
      error: { message: first.message.split("\n")[0], ...position(first.pos[0]) },
    };
  }

  function base(node: YamlNode | null | undefined, key: string, path: string, at: number) {
    const [start, , end] = node?.range ?? [at, at, at];
    const pos = position(start);
    return { id: path, key, line: pos.line, column: pos.column, start, end };
  }

  function convert(node: unknown, key: string, path: string, at: number): TreeNode {
    if (isMap(node)) {
      return {
        ...base(node, key, path, at),
        type: "object",
        children: node.items.filter(isPair).map((pair) => {
          const keyText = isScalar(pair.key) ? String(pair.key.value) : String(pair.key);
          const keyStart = (pair.key as YamlNode | null)?.range?.[0] ?? at;
          const child = convert(pair.value, keyText, childPath(path, keyText), keyStart);
          const keyPos = position(keyStart);
          return { ...child, line: keyPos.line, column: keyPos.column };
        }),
      };
    }
    if (isSeq(node)) {
      return {
        ...base(node, key, path, at),
        type: "array",
        children: node.items.map((item, i) => convert(item, `[${i}]`, childPath(path, i), node.range?.[0] ?? at)),
      };
    }
    if (isAlias(node)) {
      return { ...base(node, key, path, at), type: "string", value: `*${node.source}` };
    }
    const value = isScalar(node) ? node.value : null;
    const common = base(isScalar(node) ? node : null, key, path, at);
    if (value === null || value === undefined) return { ...common, type: "null", value: "null" };
    if (typeof value === "number" || typeof value === "bigint") return { ...common, type: "number", value: String(value) };
    if (typeof value === "boolean") return { ...common, type: "boolean", value: String(value) };
    return { ...common, type: "string", value: String(value) };
  }

  return { ok: true, root: convert(doc.contents, "$", "$", 0) };
}
