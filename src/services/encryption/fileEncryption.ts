/**
 * Client-side-only AES-256-GCM encryption for the lock feature (see prisma/schema.prisma's File
 * model comment). The passphrase never leaves the browser and is never stored — only the salt,
 * iv, and resulting ciphertext are persisted. A wrong passphrase fails GCM's built-in auth-tag
 * verification, which is what IncorrectPassphraseError below is thrown from.
 */

const PBKDF2_ITERATIONS = 210_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export class IncorrectPassphraseError extends Error {
  constructor() {
    super("Incorrect passphrase.");
    this.name = "IncorrectPassphraseError";
  }
}

function bytesToBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export interface EncryptedPayload {
  ciphertext: string;
  salt: string;
  iv: string;
}

/** Encrypts plaintext with a freshly-generated random salt + iv. */
export async function encryptContent(plaintext: string, passphrase: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext),
  );
  return { ciphertext: bytesToBase64(encrypted), salt: bytesToBase64(salt), iv: bytesToBase64(iv) };
}

/** Decrypts previously-encrypted content. Throws IncorrectPassphraseError if the passphrase is
 *  wrong (or the data was tampered with) — GCM's auth tag fails to verify in both cases. */
export async function decryptContent(
  ciphertextB64: string,
  passphrase: string,
  saltB64: string,
  ivB64: string,
): Promise<string> {
  const salt = base64ToBytes(saltB64);
  const iv = base64ToBytes(ivB64);
  const key = await deriveKey(passphrase, salt);
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      base64ToBytes(ciphertextB64) as BufferSource,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new IncorrectPassphraseError();
  }
}
