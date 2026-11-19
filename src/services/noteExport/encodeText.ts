import { LANGUAGES } from "@/lib/constants/languages";

/**
 * Turns note text into the bytes of its chosen encoding. Characters a
 * single-byte encoding can't hold become "?", like most desktop editors do.
 */
export function encodeText(text: string, encoding: string): Uint8Array {
  switch (encoding) {
    case "UTF-8 BOM":
      return concat(
        new Uint8Array([0xef, 0xbb, 0xbf]),
        new TextEncoder().encode(text),
      );
    case "UTF-16 LE":
      return utf16(text, true);
    case "UTF-16 BE":
      return utf16(text, false);
    case "ASCII":
      return singleByte(text, 0x7f);
    case "ISO-8859-1":
      return singleByte(text, 0xff);
    default:
      return new TextEncoder().encode(text);
  }
}

function utf16(text: string, littleEndian: boolean): Uint8Array {
  const bytes = new Uint8Array(2 + text.length * 2);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, 0xfeff, littleEndian);
  for (let i = 0; i < text.length; i++) {
    view.setUint16(2 + i * 2, text.charCodeAt(i), littleEndian);
  }
  return bytes;
}

function singleByte(text: string, max: number): Uint8Array {
  const chars = Array.from(text);
  const bytes = new Uint8Array(chars.length);
  chars.forEach((ch, i) => {
    const code = ch.codePointAt(0) ?? 0x3f;
    bytes[i] = code <= max ? code : 0x3f;
  });
  return bytes;
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
}

/** The note's own name, plus an extension from its language when it has none. */
export function downloadFileName(name: string, language: string): string {
  const clean = name.replace(/[\\/:*?"<>|]/g, "_").trim() || "note";
  if (/\.[A-Za-z0-9]+$/.test(clean)) return clean;
  const ext = LANGUAGES.find((l) => l.id === language)?.extensions[0] ?? "txt";
  return `${clean}.${ext}`;
}
