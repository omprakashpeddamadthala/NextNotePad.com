import assert from "node:assert/strict";
import {
  binaryToDecimal,
  caseConverters,
  collapseBlankLines,
  computeHash,
  computeTextStats,
  decimalToBinary,
  decimalToHex,
  hexToDecimal,
  removeDuplicateLines,
  sortLinesAscending,
  trimTrailingWhitespace,
  unixToIsoDate,
} from "../src/services/textTools/textTools";

async function main() {
  assert.equal(
    caseConverters.title("élan vital déjà VU"),
    "Élan Vital Déjà Vu",
  );
  assert.equal(
    caseConverters.sentence("élan vital. déjà vu? über cool!"),
    "Élan vital. Déjà vu? Über cool!",
  );

  assert.equal(
    trimTrailingWhitespace("alpha  \r\nbeta\t\r\n"),
    "alpha\r\nbeta\r\n",
  );
  assert.equal(
    collapseBlankLines("alpha\r\n \r\n\t\r\nbeta"),
    "alpha\r\n\r\nbeta",
  );
  assert.equal(sortLinesAscending("z\r\na\r\nm"), "a\r\nm\r\nz");
  assert.equal(removeDuplicateLines("a\r\nb\r\na"), "a\r\nb");

  const largeDecimal = "9007199254740993123456789";
  const largeHex = decimalToHex(largeDecimal);
  assert.equal(hexToDecimal(largeHex), largeDecimal);
  assert.equal(binaryToDecimal(decimalToBinary(largeDecimal)), largeDecimal);
  assert.equal(hexToDecimal("-0xabcdef"), String(-0xabcdef));

  assert.equal(
    unixToIsoDate("999999999999"),
    "2001-09-09T01:46:39.999Z",
  );
  assert.equal(
    unixToIsoDate("99999999999"),
    "5138-11-16T09:46:39.000Z",
  );
  assert.equal(
    await computeHash("SHA-256", ""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
  assert.deepEqual(computeTextStats(""), {
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    lines: 0,
  });

  console.log("Text tool regression tests passed.");
}

void main();
