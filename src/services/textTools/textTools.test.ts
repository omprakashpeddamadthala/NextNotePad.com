import assert from "node:assert/strict";
import test from "node:test";
import {
  binaryToDecimal,
  caseConverters,
  collapseBlankLines,
  decimalToBinary,
  decimalToHex,
  hexToDecimal,
  trimTrailingWhitespace,
  unixToIsoDate,
} from "./textTools";

test("case conversion recognizes Unicode word and sentence boundaries", () => {
  assert.equal(caseConverters.title("élan vital"), "Élan Vital");
  assert.equal(caseConverters.title("mañana será"), "Mañana Será");
  assert.equal(
    caseConverters.sentence("привет. ДОБРЫЙ ДЕНЬ!"),
    "Привет. Добрый день!",
  );
});

test("whitespace transforms preserve CRLF line endings", () => {
  assert.equal(
    trimTrailingWhitespace("first  \r\nsecond\t\r\n"),
    "first\r\nsecond\r\n",
  );
  assert.equal(
    collapseBlankLines("first\r\n\r\n\r\nsecond"),
    "first\r\n\r\nsecond",
  );
});

test("base conversions preserve integers beyond Number.MAX_SAFE_INTEGER", () => {
  assert.equal(decimalToHex("9007199254740993"), "20000000000001");
  assert.equal(hexToDecimal("20000000000001"), "9007199254740993");
  assert.equal(
    decimalToBinary("-9007199254740993"),
    "-100000000000000000000000000000000000000000000000000001",
  );
  assert.equal(
    binaryToDecimal("-100000000000000000000000000000000000000000000000000001"),
    "-9007199254740993",
  );
});

test("Unix timestamp conversion recognizes 12-digit millisecond values", () => {
  assert.equal(unixToIsoDate("946684800000"), "2000-01-01T00:00:00.000Z");
  assert.equal(unixToIsoDate("946684800"), "2000-01-01T00:00:00.000Z");
});
