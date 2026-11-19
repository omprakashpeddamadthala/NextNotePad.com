import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJsonTree } from "./parseJson";
import { parseYamlTree } from "./parseYaml";
import { parseXmlTree } from "./parseXml";
import { treeFormatFor } from "./parseNote";
import { containerIdsToLevel, findNode, searchTree, visibleRows } from "./searchTree";
import type { TreeNode, TreeParseResult } from "./treeModel";

function rootOf(result: TreeParseResult): TreeNode {
  assert.ok(result.ok, result.ok ? "" : result.error.message);
  return result.root;
}

const JSON_TEXT = `{
  "name": "Ada",
  "age": 36,
  "tags": ["math", "code"],
  "odd key": null,
  "active": true
}`;

test("JSON: types, keys, paths and line numbers", () => {
  const root = rootOf(parseJsonTree(JSON_TEXT));
  assert.equal(root.type, "object");
  const [name, age, tags, odd, active] = root.children!;
  assert.deepEqual([name.key, name.type, name.value, name.id, name.line], ["name", "string", "Ada", "$.name", 2]);
  assert.deepEqual([age.type, age.value], ["number", "36"]);
  assert.equal(tags.type, "array");
  assert.deepEqual(tags.children!.map((c) => [c.key, c.id]), [["[0]", "$.tags[0]"], ["[1]", "$.tags[1]"]]);
  assert.deepEqual([odd.id, odd.type], ['$["odd key"]', "null"]);
  assert.deepEqual([active.type, active.value, active.line], ["boolean", "true", 6]);
});

test("JSON: comments and trailing commas are accepted", () => {
  const root = rootOf(parseJsonTree('{ // note\n "a": [1, 2,], }'));
  assert.equal(root.children![0].children!.length, 2);
});

test("JSON: errors report line and column", () => {
  const result = parseJsonTree('{\n  "a": 1\n  "b": 2\n}');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.line, 3);
    assert.match(result.error.message, /comma expected/i);
  }
});

test("JSON: source offsets cover the whole value", () => {
  const root = rootOf(parseJsonTree(JSON_TEXT));
  const tags = root.children![2];
  assert.equal(JSON_TEXT.slice(tags.start, tags.end), '["math", "code"]');
});

test("YAML: maps, lists, scalars and lines", () => {
  const root = rootOf(parseYamlTree("server:\n  port: 8080\n  hosts:\n    - a.example\n    - b.example\ndebug: false\nnote: ~\n"));
  const [server, debug, note] = root.children!;
  assert.equal(server.type, "object");
  const [port, hosts] = server.children!;
  assert.deepEqual([port.id, port.type, port.value, port.line], ["$.server.port", "number", "8080", 2]);
  assert.deepEqual(hosts.children!.map((h) => h.value), ["a.example", "b.example"]);
  assert.equal(hosts.children![1].line, 5);
  assert.deepEqual([debug.type, debug.value], ["boolean", "false"]);
  assert.equal(note.type, "null");
});

test("YAML: errors report a line", () => {
  const result = parseYamlTree("a: 1\nb: 2\n\tc: 3\n");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.line, 3);
    assert.match(result.error.message, /tabs/i);
  }
});

const XML_TEXT = `<?xml version="1.0"?>
<!-- catalog -->
<catalog lang="en">
  <book id="b1">
    <title>Dune &amp; more</title>
  </book>
  <book id="b2"><title><![CDATA[<Foundation>]]></title></book>
  <note>Mixed <b>bold</b> text</note>
  <empty/>
</catalog>`;

test("XML: elements, attributes, repeated names and text leaves", () => {
  const root = rootOf(parseXmlTree(XML_TEXT));
  assert.deepEqual([root.key, root.id, root.line], ["catalog", "/catalog", 3]);
  const [lang, book1, book2, note, empty] = root.children!;
  assert.deepEqual([lang.key, lang.type, lang.value, lang.id], ["@lang", "attribute", "en", "/catalog/@lang"]);
  assert.equal(book1.id, "/catalog/book[1]");
  assert.equal(book2.id, "/catalog/book[2]");
  const title1 = book1.children![1];
  assert.deepEqual([title1.key, title1.value, title1.id, title1.line], ["title", "Dune & more", "/catalog/book[1]/title", 5]);
  assert.equal(book2.children![1].value, "<Foundation>");
  assert.deepEqual(note.children!.map((c) => c.key), ["#text", "b", "#text"]);
  assert.equal(note.children![0].id, "/catalog/note/text()[1]");
  assert.deepEqual([empty.key, empty.value, empty.children], ["empty", "", undefined]);
});

test("XML: mismatched and unclosed tags are reported with a line", () => {
  const mismatch = parseXmlTree("<a>\n  <b></c>\n</a>");
  assert.equal(mismatch.ok, false);
  if (!mismatch.ok) {
    assert.equal(mismatch.error.line, 2);
    assert.match(mismatch.error.message, /Expected <\/b>/);
  }
  const unclosed = parseXmlTree("<a>\n<b>");
  assert.equal(unclosed.ok, false);
  const twoRoots = parseXmlTree("<a/><b/>");
  assert.equal(twoRoots.ok, false);
});

test("search finds keys and values, case-insensitively, with ancestors", () => {
  const root = rootOf(parseJsonTree(JSON_TEXT));
  const both = searchTree(root, { query: "A", keys: true, values: true });
  assert.deepEqual(both.matches, ["$.name", "$.age", "$.tags", "$.tags[0]", "$.active"]);
  const valuesOnly = searchTree(root, { query: "code", keys: false, values: true });
  assert.deepEqual(valuesOnly.matches, ["$.tags[1]"]);
  assert.deepEqual([...valuesOnly.ancestors], ["$", "$.tags"]);
  const keysOnly = searchTree(root, { query: "code", keys: true, values: false });
  assert.deepEqual(keysOnly.matches, []);
  assert.deepEqual(searchTree(root, { query: "  ", keys: true, values: true }).matches, []);
});

test("visible rows follow expanded state and the only-matches filter", () => {
  const root = rootOf(parseJsonTree(JSON_TEXT));
  assert.equal(visibleRows(root, new Set()).length, 1);
  assert.equal(visibleRows(root, new Set(["$"])).length, 6);
  assert.equal(visibleRows(root, new Set(["$", "$.tags"])).length, 8);
  const only = visibleRows(root, new Set(["$", "$.tags"]), new Set(["$", "$.tags", "$.tags[1]"]));
  assert.deepEqual(only.map((r) => [r.node.id, r.depth]), [["$", 0], ["$.tags", 1], ["$.tags[1]", 2]]);
});

test("expand to level and find by id", () => {
  const root = rootOf(parseJsonTree('{"a":{"b":{"c":1}},"d":[1]}'));
  assert.deepEqual([...containerIdsToLevel(root, 1)], ["$"]);
  assert.deepEqual([...containerIdsToLevel(root, 2)], ["$", "$.a", "$.d"]);
  assert.equal(findNode(root, "$.a.b.c")?.value, "1");
  assert.equal(findNode(root, "$.nope"), undefined);
});

test("tree format comes from the language or the file extension", () => {
  assert.equal(treeFormatFor("json", "x.txt"), "json");
  assert.equal(treeFormatFor("plaintext", "config.yml"), "yaml");
  assert.equal(treeFormatFor("plaintext", "icon.svg"), "xml");
  assert.equal(treeFormatFor("plaintext", "notes.txt"), null);
});
