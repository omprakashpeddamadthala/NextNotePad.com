import crypto from "node:crypto";

// `promisify(crypto.scrypt)` drops the overload that takes options, so wrap it by hand.
function scryptAsync(
  password: string,
  salt: string,
  keylen: number,
  options: crypto.ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

// OWASP recommended scrypt parameters for password hashing:
// N = 16384 (cost factor), r = 8 (block size), p = 1 (parallelization), keylen = 64 bytes
const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

export interface PasswordHashResult {
  hash: string;
  salt: string;
}

/**
 * Securely hashes a lock password using scrypt with a cryptographically secure random salt.
 * Accepts any character string including letters, numbers, symbols, spaces, and Unicode.
 */
export async function hashLockPassword(password: string): Promise<PasswordHashResult> {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Lock password cannot be empty");
  }

  // Generate 16 bytes (128 bits) of cryptographic random salt
  const salt = crypto.randomBytes(16).toString("hex");

  const derivedKey = await scryptAsync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: 32 * 1024 * 1024,
  });

  return {
    hash: derivedKey.toString("hex"),
    salt,
  };
}

/**
 * Verifies an entered password against a stored scrypt hash and salt.
 * Uses timingSafeEqual to protect against side-channel timing attacks.
 */
export async function verifyLockPassword(
  password: string,
  storedHash: string,
  salt: string,
): Promise<boolean> {
  if (
    typeof password !== "string" ||
    password.length === 0 ||
    !storedHash ||
    !salt
  ) {
    return false;
  }

  try {
    const derivedKey = await scryptAsync(password, salt, SCRYPT_KEYLEN, {
      N: SCRYPT_COST,
      r: SCRYPT_BLOCK_SIZE,
      p: SCRYPT_PARALLELIZATION,
      maxmem: 32 * 1024 * 1024,
    });

    const storedBuffer = Buffer.from(storedHash, "hex");

    if (derivedKey.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, storedBuffer);
  } catch (err) {
    console.error("[lock/passwordHash] Verification error:", err);
    return false;
  }
}
