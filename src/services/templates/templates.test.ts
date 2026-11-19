import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_TEMPLATES,
  extensionOf,
  fillPlaceholders,
  templateFileName,
} from "./templateText";

const NOW = new Date(2026, 10, 9, 7, 5); // 9 Nov 2026, 07:05 local time

test("fillPlaceholders fills date and time with zero padding", () => {
  assert.equal(fillPlaceholders("{{date}} at {{time}}", NOW), "2026-11-09 at 07:05");
});

test("fillPlaceholders accepts spaces and any case, and leaves other text alone", () => {
  assert.equal(fillPlaceholders("{{ DATE }}|{{Time}}|{{name}}", NOW), "2026-11-09|07:05|{{name}}");
});

test("templateFileName adds the date and extension", () => {
  assert.equal(templateFileName("Meeting notes", "md", NOW, new Set()), "Meeting notes 2026-11-09.md");
  assert.equal(templateFileName("Plan", ".txt", NOW, new Set()), "Plan 2026-11-09.txt");
  assert.equal(templateFileName("Plan", "", NOW, new Set()), "Plan 2026-11-09.txt");
});

test("templateFileName picks a free name when one is taken", () => {
  const taken = new Set(["plan 2026-11-09.md", "plan 2026-11-09 (2).md"]);
  assert.equal(templateFileName("Plan", "md", NOW, taken), "Plan 2026-11-09 (3).md");
});

test("extensionOf reads the extension or falls back to txt", () => {
  assert.equal(extensionOf("notes.MD"), "md");
  assert.equal(extensionOf("README"), "txt");
});

test("built-in templates have unique ids and non-empty content", () => {
  const ids = BUILT_IN_TEMPLATES.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of BUILT_IN_TEMPLATES) assert.ok(t.content.trim().length > 0, t.id);
});
