/**
 * Formatters for languages Monaco has no built-in formatter for (or where a
 * guaranteed-correct result matters more than Monaco's best-effort one, e.g. JSON).
 * Everything else (html, css, scss, less, javascript, typescript, …) falls back
 * to Monaco's own `editor.action.formatDocument` / `formatSelection`.
 */

function formatJson(text: string, tabWidth: number): string {
  const parsed: unknown = JSON.parse(text);
  return JSON.stringify(parsed, null, tabWidth);
}

function formatXml(text: string, tabWidth: number): string {
  const pad = " ".repeat(tabWidth);
  const withBreaks = text.replace(/>\s*</g, ">\n<").trim();
  if (!withBreaks) return text;

  const lines = withBreaks.split("\n");
  let depth = 0;
  const out: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const isDeclaration = /^<\?/.test(line);
    const isComment = /^<!--.*-->$/.test(line);
    const isClosing = /^<\/[^>]+>$/.test(line);
    const isSelfClosing = /\/>$/.test(line);
    const isOpeningOnly = /^<[^/!?][^>]*[^/]>$/.test(line) && !isSelfClosing;

    if (isClosing) depth = Math.max(depth - 1, 0);
    out.push(pad.repeat(depth) + line);
    if (isOpeningOnly && !isDeclaration && !isComment) depth += 1;
  }

  return out.join("\n");
}

export const CUSTOM_FORMATTERS: Record<string, (text: string, tabWidth: number) => string> = {
  json: formatJson,
  xml: formatXml,
};
