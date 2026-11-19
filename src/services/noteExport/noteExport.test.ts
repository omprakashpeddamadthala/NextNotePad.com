import { test } from "node:test";
import assert from "node:assert/strict";
import { downloadFileName, encodeText } from "./encodeText";

const bytes = (u: Uint8Array) => Array.from(u);

test("UTF-8 is the default and has no BOM", () => {
  assert.deepEqual(bytes(encodeText("é", "UTF-8")), [0xc3, 0xa9]);
  assert.deepEqual(bytes(encodeText("a", "unknown")), [0x61]);
});

test("UTF-8 BOM prefixes EF BB BF", () => {
  assert.deepEqual(
    bytes(encodeText("a", "UTF-8 BOM")),
    [0xef, 0xbb, 0xbf, 0x61],
  );
});

test("UTF-16 LE and BE write a BOM and two bytes per code unit", () => {
  assert.deepEqual(
    bytes(encodeText("A", "UTF-16 LE")),
    [0xff, 0xfe, 0x41, 0x00],
  );
  assert.deepEqual(
    bytes(encodeText("A", "UTF-16 BE")),
    [0xfe, 0xff, 0x00, 0x41],
  );
  // Emoji are a surrogate pair: four bytes after the BOM.
  assert.equal(encodeText("😀", "UTF-16 LE").length, 6);
});

test("single-byte encodings replace characters they can't hold with ?", () => {
  assert.deepEqual(bytes(encodeText("aé€", "ISO-8859-1")), [0x61, 0xe9, 0x3f]);
  assert.deepEqual(bytes(encodeText("aé", "ASCII")), [0x61, 0x3f]);
  assert.deepEqual(bytes(encodeText("😀", "ASCII")), [0x3f]);
});

test("download names keep an existing extension", () => {
  assert.equal(downloadFileName("notes.md", "plaintext"), "notes.md");
  assert.equal(downloadFileName("config.json", "json"), "config.json");
});

test("download names get an extension from the language when missing", () => {
  assert.equal(downloadFileName("Untitled", "plaintext"), "Untitled.txt");
  assert.equal(downloadFileName("readme", "markdown"), "readme.md");
  assert.equal(downloadFileName("thing", "no-such-language"), "thing.txt");
});

test("download names drop characters that are invalid in file names", () => {
  assert.equal(downloadFileName("a/b:c?.txt", "plaintext"), "a_b_c_.txt");
  assert.equal(downloadFileName("   ", "plaintext"), "note.txt");
});
