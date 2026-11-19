import { createLineIndex, type TreeNode, type TreeParseResult } from "./treeModel";

/**
 * A small XML reader that keeps line numbers (the browser's DOMParser drops
 * them). It reads elements, attributes, text and CDATA, and skips the XML
 * declaration, comments, processing instructions and DOCTYPE.
 */

const NAME = /^[A-Za-z_:][\w:.-]*/;
const ENTITIES: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

class XmlError extends Error {
  constructor(message: string, readonly offset: number) {
    super(message);
  }
}

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, ref: string) => {
    if (ref[0] === "#") {
      const code = ref[1].toLowerCase() === "x" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[ref] ?? whole;
  });
}

interface RawElement {
  name: string;
  start: number;
  end: number;
  attributes: { name: string; value: string; start: number; end: number }[];
  /** Child elements and text pieces, in document order. */
  content: (RawElement | { text: string; start: number; end: number })[];
}

function readDocument(src: string): RawElement {
  let i = 0;
  let root: RawElement | null = null;
  const stack: RawElement[] = [];

  const fail = (message: string, at = i): never => {
    throw new XmlError(message, at);
  };
  const skipPast = (token: string, what: string) => {
    const close = src.indexOf(token, i);
    if (close === -1) fail(`Unclosed ${what}`);
    i = close + token.length;
  };

  while (i < src.length) {
    const lt = src.indexOf("<", i);
    const textEnd = lt === -1 ? src.length : lt;
    if (textEnd > i) {
      const raw = src.slice(i, textEnd);
      if (stack.length > 0) {
        stack[stack.length - 1].content.push({ text: decode(raw), start: i, end: textEnd });
      } else if (raw.trim()) {
        fail(root ? "Text after the root element" : "Text before the root element");
      }
      i = textEnd;
      if (lt === -1) break;
    }

    if (src.startsWith("<!--", i)) skipPast("-->", "comment");
    else if (src.startsWith("<?", i)) skipPast("?>", "processing instruction");
    else if (src.startsWith("<![CDATA[", i)) {
      const start = i;
      const close = src.indexOf("]]>", i);
      if (close === -1) fail("Unclosed CDATA section");
      if (stack.length === 0) fail("CDATA outside the root element");
      stack[stack.length - 1].content.push({ text: src.slice(i + 9, close), start, end: close + 3 });
      i = close + 3;
    } else if (src.startsWith("<!", i)) {
      // DOCTYPE, possibly with an internal [ ... ] subset.
      const bracket = src.indexOf("[", i);
      const gt = src.indexOf(">", i);
      if (bracket !== -1 && bracket < gt) skipPast("]>", "DOCTYPE");
      else skipPast(">", "DOCTYPE");
    } else if (src.startsWith("</", i)) {
      const start = i;
      i += 2;
      const name = NAME.exec(src.slice(i))?.[0];
      if (!name) fail("Expected an element name after </");
      i += name!.length;
      while (/\s/.test(src[i] ?? "")) i++;
      if (src[i] !== ">") fail(`Expected ">" to close </${name}`);
      i++;
      const open = stack.pop();
      if (!open) fail(`Closing tag </${name}> has no matching opening tag`, start);
      if (open!.name !== name) fail(`Expected </${open!.name}> but found </${name}>`, start);
      open!.end = i;
    } else {
      const start = i;
      i++;
      const name = NAME.exec(src.slice(i))?.[0];
      if (!name) fail('Expected an element name after "<"');
      i += name!.length;
      const element: RawElement = { name: name!, start, end: -1, attributes: [], content: [] };
      for (;;) {
        while (/\s/.test(src[i] ?? "")) i++;
        if (src.startsWith("/>", i)) {
          i += 2;
          element.end = i;
          break;
        }
        if (src[i] === ">") {
          i++;
          break;
        }
        if (i >= src.length) fail(`Unclosed tag <${name}>`, start);
        const attrStart = i;
        const attr = NAME.exec(src.slice(i))?.[0];
        if (!attr) fail(`Unexpected "${src[i]}" in <${name}>`);
        i += attr!.length;
        while (/\s/.test(src[i] ?? "")) i++;
        if (src[i] !== "=") fail(`Expected "=" after attribute ${attr}`);
        i++;
        while (/\s/.test(src[i] ?? "")) i++;
        const quote = src[i];
        if (quote !== '"' && quote !== "'") fail(`Attribute ${attr} needs a quoted value`);
        const close = src.indexOf(quote, i + 1);
        if (close === -1) fail(`Unclosed value for attribute ${attr}`);
        element.attributes.push({ name: attr!, value: decode(src.slice(i + 1, close)), start: attrStart, end: close + 1 });
        i = close + 1;
      }

      if (stack.length > 0) stack[stack.length - 1].content.push(element);
      else if (root) fail("Only one root element is allowed", start);
      else root = element;
      if (element.end === -1) stack.push(element);
    }
  }

  if (stack.length > 0) fail(`<${stack[stack.length - 1].name}> is never closed`, stack[stack.length - 1].start);
  if (!root) fail("No root element found", 0);
  return root!;
}

export function parseXmlTree(text: string): TreeParseResult {
  const position = createLineIndex(text);
  let root: RawElement;
  try {
    root = readDocument(text);
  } catch (err) {
    if (!(err instanceof XmlError)) throw err;
    return { ok: false, error: { message: err.message, ...position(err.offset) } };
  }

  function convert(el: RawElement, path: string): TreeNode {
    const pos = position(el.start);
    const base = { id: path, key: el.name, type: "element" as const, line: pos.line, column: pos.column, start: el.start, end: el.end };
    const elements = el.content.filter((c): c is RawElement => "name" in c);
    const texts = el.content.filter((c): c is { text: string; start: number; end: number } => "text" in c && c.text.trim() !== "");

    // <name>text</name> with nothing else reads best as a single key: value row.
    if (el.attributes.length === 0 && elements.length === 0) {
      return { ...base, value: texts.map((t) => t.text.trim()).join(" ") };
    }

    const counts = new Map<string, number>();
    for (const c of elements) counts.set(c.name, (counts.get(c.name) ?? 0) + 1);
    const seen = new Map<string, number>();
    let textIndex = 0;

    const children: TreeNode[] = el.attributes.map((a) => {
      const at = position(a.start);
      return { id: `${path}/@${a.name}`, key: `@${a.name}`, type: "attribute", value: a.value, line: at.line, column: at.column, start: a.start, end: a.end };
    });
    for (const c of el.content) {
      if ("name" in c) {
        const n = (seen.get(c.name) ?? 0) + 1;
        seen.set(c.name, n);
        children.push(convert(c, `${path}/${c.name}${(counts.get(c.name) ?? 0) > 1 ? `[${n}]` : ""}`));
      } else if (c.text.trim()) {
        textIndex++;
        const at = position(c.start);
        children.push({
          id: `${path}/text()${texts.length > 1 ? `[${textIndex}]` : ""}`,
          key: "#text",
          type: "text",
          value: c.text.trim(),
          line: at.line,
          column: at.column,
          start: c.start,
          end: c.end,
        });
      }
    }
    return { ...base, children };
  }

  return { ok: true, root: convert(root, `/${root.name}`) };
}
