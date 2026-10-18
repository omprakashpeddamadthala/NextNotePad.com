import { prisma } from "@/lib/db/prisma";
import { hashLockPassword, verifyLockPassword } from "./passwordHash";
import {
  signUnlockToken,
  verifyUnlockToken,
  getTodayDateString,
  UNLOCK_COOKIE_NAME,
} from "./lockTokens";

export interface LockConfigDto {
  enabled: boolean;
  isLocked: boolean;
  policy: "next_visit" | "new_day" | "immediate";
  pwaOnResume: boolean;
  autoTimeoutMinutes: number;
}

export interface UserLockRecord {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  blocked: boolean;
  lockEnabled: boolean;
  lockPasswordHash: string | null;
  lockPasswordSalt: string | null;
  lockPolicy: string;
  lockPwaOnResume: boolean;
  lockAutoTimeoutMinutes: number;
  lockLastUnlockedAt: Date | null;
  lockFailedAttempts: number;
  lockLockedUntil: Date | null;
}

let schemaEnsured = false;

/**
 * Idempotently ensures the password lock database columns exist on the User table.
 * Uses individual native ALTER TABLE statements compatible with PostgreSQL and SQLite.
 */
export async function ensureLockSchema(): Promise<void> {
  if (schemaEnsured) return;

  const runSql = async (sql: string) => {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      // Ignore if column already exists
      const msg = String(err).toLowerCase();
      if (!msg.includes("already exists") && !msg.includes("duplicate column")) {
        console.warn("[lockService/schema] SQL notice:", msg);
      }
    }
  };

  try {
    // PostgreSQL native ADD COLUMN IF NOT EXISTS
    await runSql(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockEnabled" BOOLEAN NOT NULL DEFAULT false;`);
    await runSql(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockPasswordHash" TEXT;`);
    await runSql(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockPasswordSalt" TEXT;`);
    await runSql(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockPolicy" TEXT NOT NULL DEFAULT 'next_visit';`);
    await runSql(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockPwaOnResume" BOOLEAN NOT NULL DEFAULT true;`);
    await runSql(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockAutoTimeoutMinutes" INTEGER NOT NULL DEFAULT 0;`);
    await runSql(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockLastUnlockedAt" TIMESTAMP(3);`);
    await runSql(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockFailedAttempts" INTEGER NOT NULL DEFAULT 0;`);
    await runSql(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockLockedUntil" TIMESTAMP(3);`);

    schemaEnsured = true;
  } catch (err) {
    console.warn("[lockService] Schema ensure notice:", err);
  }
}

/**
 * Loads a user's complete lock record directly from the database using raw SQL.
 * This guarantees reliable operation regardless of Prisma generated client synchronization.
 */
export async function getUserLockRecord(userId: string): Promise<UserLockRecord | null> {
  await ensureLockSchema();

  try {
    const rows = await prisma.$queryRawUnsafe<UserLockRecord[]>(
      `SELECT "id", "email", "name", "avatarUrl", "isAdmin", "blocked",
              COALESCE("lockEnabled", false) AS "lockEnabled",
              "lockPasswordHash", "lockPasswordSalt",
              COALESCE("lockPolicy", 'next_visit') AS "lockPolicy",
              COALESCE("lockPwaOnResume", true) AS "lockPwaOnResume",
              COALESCE("lockAutoTimeoutMinutes", 0) AS "lockAutoTimeoutMinutes",
              "lockLastUnlockedAt",
              COALESCE("lockFailedAttempts", 0) AS "lockFailedAttempts",
              "lockLockedUntil"
       FROM "User" WHERE "id" = $1 LIMIT 1`,
      userId,
    );
    return rows[0] || null;
  } catch (err) {
    console.error("[lockService/getUserLockRecord] Query error:", err);
    return null;
  }
}

/**
 * Checks whether a user is currently locked.
 */
export async function isUserLocked(
  user: { id: string; lockEnabled?: boolean; lockPolicy?: string },
  cookieStore?: { get: (name: string) => { value: string } | undefined },
): Promise<{ isLocked: boolean; reason?: string }> {
  const record = await getUserLockRecord(user.id);
  if (!record || !record.lockEnabled) {
    return { isLocked: false };
  }

  const unlockCookie = cookieStore?.get(UNLOCK_COOKIE_NAME)?.value;
  if (!unlockCookie) {
    return { isLocked: true, reason: "no_unlock_cookie" };
  }

  const payload = await verifyUnlockToken(unlockCookie);
  if (!payload || payload.userId !== user.id) {
    return { isLocked: true, reason: "invalid_unlock_token" };
  }

  const policy = (record.lockPolicy as LockConfigDto["policy"]) || "next_visit";

  // New day policy: lock when visiting on the next day
  if (policy === "new_day") {
    const today = getTodayDateString();
    if (payload.unlockedDate !== today) {
      return { isLocked: true, reason: "new_day" };
    }
  }

  return { isLocked: false };
}

/**
 * Sets up or enables lock password for a user.
 */
export async function setupUserLock(
  userId: string,
  password: string,
  options?: {
    policy?: string;
    pwaOnResume?: boolean;
    autoTimeoutMinutes?: number;
  },
): Promise<{ success: boolean; unlockToken: string }> {
  await ensureLockSchema();

  const { hash, salt } = await hashLockPassword(password);
  const policy = options?.policy || "next_visit";
  const pwaOnResume =
    options?.pwaOnResume !== undefined ? options.pwaOnResume : true;
  const autoTimeoutMinutes = options?.autoTimeoutMinutes ?? 0;

  await prisma.$executeRawUnsafe(
    `UPDATE "User"
     SET "lockEnabled" = true,
         "lockPasswordHash" = $1,
         "lockPasswordSalt" = $2,
         "lockPolicy" = $3,
         "lockPwaOnResume" = $4,
         "lockAutoTimeoutMinutes" = $5,
         "lockLastUnlockedAt" = NOW(),
         "lockFailedAttempts" = 0,
         "lockLockedUntil" = NULL
     WHERE "id" = $6`,
    hash,
    salt,
    policy,
    pwaOnResume,
    autoTimeoutMinutes,
    userId,
  );

  const unlockToken = await signUnlockToken({
    userId,
    policy,
  });

  return { success: true, unlockToken };
}

/**
 * Changes a user's lock password.
 */
export async function changeUserLockPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  options?: {
    policy?: string;
    pwaOnResume?: boolean;
    autoTimeoutMinutes?: number;
  },
): Promise<{ success: boolean; error?: string; unlockToken?: string }> {
  const user = await getUserLockRecord(userId);
  if (!user || !user.lockPasswordHash || !user.lockPasswordSalt) {
    return { success: false, error: "Password lock is not configured." };
  }

  const valid = await verifyLockPassword(
    currentPassword,
    user.lockPasswordHash,
    user.lockPasswordSalt,
  );

  if (!valid) {
    return { success: false, error: "Current lock password is incorrect." };
  }

  const { hash, salt } = await hashLockPassword(newPassword);
  const policy = options?.policy || user.lockPolicy || "next_visit";
  const pwaOnResume =
    options?.pwaOnResume !== undefined
      ? options.pwaOnResume
      : user.lockPwaOnResume;
  const autoTimeoutMinutes =
    options?.autoTimeoutMinutes ?? user.lockAutoTimeoutMinutes;

  await prisma.$executeRawUnsafe(
    `UPDATE "User"
     SET "lockPasswordHash" = $1,
         "lockPasswordSalt" = $2,
         "lockPolicy" = $3,
         "lockPwaOnResume" = $4,
         "lockAutoTimeoutMinutes" = $5,
         "lockLastUnlockedAt" = NOW(),
         "lockFailedAttempts" = 0,
         "lockLockedUntil" = NULL
     WHERE "id" = $6`,
    hash,
    salt,
    policy,
    pwaOnResume,
    autoTimeoutMinutes,
    userId,
  );

  const unlockToken = await signUnlockToken({
    userId,
    policy,
  });

  return { success: true, unlockToken };
}

/**
 * Disables password lock for a user after verifying their current password.
 */
export async function disableUserLock(
  userId: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getUserLockRecord(userId);
  if (!user || !user.lockPasswordHash || !user.lockPasswordSalt) {
    return { success: false, error: "Password lock is not active." };
  }

  const valid = await verifyLockPassword(
    password,
    user.lockPasswordHash,
    user.lockPasswordSalt,
  );

  if (!valid) {
    return { success: false, error: "Incorrect lock password." };
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "User"
     SET "lockEnabled" = false,
         "lockPasswordHash" = NULL,
         "lockPasswordSalt" = NULL,
         "lockFailedAttempts" = 0,
         "lockLockedUntil" = NULL
     WHERE "id" = $1`,
    userId,
  );

  return { success: true };
}

/**
 * Updates lock settings without changing the password.
 */
export async function updateLockSettings(
  userId: string,
  options: {
    policy?: string;
    pwaOnResume?: boolean;
    autoTimeoutMinutes?: number;
  },
): Promise<{ success: boolean }> {
  await ensureLockSchema();

  await prisma.$executeRawUnsafe(
    `UPDATE "User"
     SET "lockPolicy" = COALESCE($1, "lockPolicy"),
         "lockPwaOnResume" = COALESCE($2, "lockPwaOnResume"),
         "lockAutoTimeoutMinutes" = COALESCE($3, "lockAutoTimeoutMinutes")
     WHERE "id" = $4`,
    options.policy ?? null,
    options.pwaOnResume ?? null,
    options.autoTimeoutMinutes ?? null,
    userId,
  );

  return { success: true };
}

/**
 * Verifies an entered lock password and returns an unlock token on success.
 * Enforces rate limiting against brute-force guessing.
 */
export async function verifyAndUnlock(
  userId: string,
  password: string,
): Promise<{
  success: boolean;
  error?: string;
  unlockToken?: string;
  retryAfterSeconds?: number;
}> {
  const user = await getUserLockRecord(userId);
  if (!user || !user.lockEnabled || !user.lockPasswordHash || !user.lockPasswordSalt) {
    return { success: false, error: "Application lock is not enabled for this user." };
  }

  // Rate limiting check
  if (user.lockLockedUntil && new Date(user.lockLockedUntil) > new Date()) {
    const waitMs = new Date(user.lockLockedUntil).getTime() - Date.now();
    const waitSec = Math.max(1, Math.ceil(waitMs / 1000));
    return {
      success: false,
      error: `Too many incorrect attempts. Please wait ${waitSec} seconds before trying again.`,
      retryAfterSeconds: waitSec,
    };
  }

  const isValid = await verifyLockPassword(
    password,
    user.lockPasswordHash,
    user.lockPasswordSalt,
  );

  if (!isValid) {
    const attempts = (user.lockFailedAttempts || 0) + 1;
    let lockedUntil: Date | null = null;

    // After 5 failed attempts: lockout for 30 seconds
    // After 10 failed attempts: lockout for 2 minutes
    if (attempts >= 10) {
      lockedUntil = new Date(Date.now() + 120 * 1000);
    } else if (attempts >= 5) {
      lockedUntil = new Date(Date.now() + 30 * 1000);
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "User"
       SET "lockFailedAttempts" = $1,
           "lockLockedUntil" = $2
       WHERE "id" = $3`,
      attempts,
      lockedUntil,
      userId,
    );

    const retryAfter = lockedUntil
      ? Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)
      : undefined;

    return {
      success: false,
      error: lockedUntil
        ? `Too many incorrect attempts. Please wait ${retryAfter} seconds.`
        : "Incorrect lock password. Please try again.",
      retryAfterSeconds: retryAfter,
    };
  }

  // On successful unlock, reset failed attempts and generate unlock token
  await prisma.$executeRawUnsafe(
    `UPDATE "User"
     SET "lockFailedAttempts" = 0,
         "lockLockedUntil" = NULL,
         "lockLastUnlockedAt" = NOW()
     WHERE "id" = $1`,
    userId,
  );

  const unlockToken = await signUnlockToken({
    userId,
    policy: user.lockPolicy || "next_visit",
  });

  return { success: true, unlockToken };
}
