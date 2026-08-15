/** JSON -> CSV / YAML conversion, backing the JSON Converter tool. Hand-rolled rather than a new
 *  dependency — this app already prefers small in-house formatters (see CUSTOM_FORMATTERS) over
 *  pulling in a library for a well-understood, bounded transform. Covers the common shapes
 *  (array of flat objects, array of primitives, a single object/nested structure) rather than
 *  the full YAML spec (no anchors, block scalars, etc.) — that's more than a quick dev tool needs.
 */

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

export function jsonToCsv(jsonText: string): string {
  const parsed: unknown = JSON.parse(jsonText);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  if (rows.length === 0) return "";

  if (typeof rows[0] !== "object" || rows[0] === null) {
    return ["value", ...rows.map((r) => csvEscape(r))].join("\n");
  }

  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r as Record<string, unknown>))));
  const header = keys.map(csvEscape).join(",");
  const dataRows = rows.map((r) => keys.map((k) => csvEscape((r as Record<string, unknown>)[k])).join(","));
  return [header, ...dataRows].join("\n");
}

function yamlEscapeString(s: string): string {
  const needsQuotes =
    s === "" ||
    /^\s|\s$/.test(s) ||
    /^(true|false|null|~|yes|no)$/i.test(s) ||
    /^-?\d+(\.\d+)?$/.test(s) ||
    /[:#[\]{}&*!|>'"%@`,]/.test(s) ||
    s.includes("\n");
  return needsQuotes ? JSON.stringify(s) : s;
}

function yamlScalar(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return yamlEscapeString(value);
  return String(value);
}

function isNonEmptyContainer(v: unknown): boolean {
  if (v === null || typeof v !== "object") return false;
  return Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0;
}

function yamlLines(value: unknown, indent: number): string[] {
  const pad = "  ".repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) return [`${pad}[]`];
    const out: string[] = [];
    for (const item of value) {
      if (isNonEmptyContainer(item)) {
        const childLines = yamlLines(item, indent + 1);
        out.push(`${pad}- ${childLines[0].slice(pad.length + 2)}`);
        out.push(...childLines.slice(1));
      } else {
        out.push(`${pad}- ${yamlScalar(item)}`);
      }
    }
    return out;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return [`${pad}{}`];
    const out: string[] = [];
    for (const [k, v] of entries) {
      if (isNonEmptyContainer(v)) {
        out.push(`${pad}${k}:`);
        out.push(...yamlLines(v, indent + 1));
      } else {
        out.push(`${pad}${k}: ${yamlScalar(v)}`);
      }
    }
    return out;
  }

  return [`${pad}${yamlScalar(value)}`];
}

export function jsonToYaml(jsonText: string): string {
  const parsed: unknown = JSON.parse(jsonText);
  return yamlLines(parsed, 0).join("\n");
}
