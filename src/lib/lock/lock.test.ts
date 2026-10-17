import assert from "node:assert/strict";
import test from "node:test";
import { hashLockPassword, verifyLockPassword } from "./passwordHash";
import {
  signUnlockToken,
  verifyUnlockToken,
  getTodayDateString,
} from "./lockTokens";

test("hashLockPassword accepts standard ASCII characters", async () => {
  const result = await hashLockPassword("mypassword123");
  assert.ok(result.hash);
  assert.ok(result.salt);
  assert.equal(typeof result.hash, "string");
  assert.equal(typeof result.salt, "string");

  const valid = await verifyLockPassword("mypassword123", result.hash, result.salt);
  assert.equal(valid, true);

  const invalid = await verifyLockPassword("wrongpassword", result.hash, result.salt);
  assert.equal(invalid, false);
});

test("hashLockPassword accepts single-character passwords (no artificial minimum length)", async () => {
  const result = await hashLockPassword("x");
  const valid = await verifyLockPassword("x", result.hash, result.salt);
  assert.equal(valid, true);

  const invalid = await verifyLockPassword("y", result.hash, result.salt);
  assert.equal(invalid, false);
});

test("hashLockPassword accepts spaces and symbols", async () => {
  const password = "   p@ss w0rd with spaces! & % ^ * ( ) _ + - = { } [ ] : ; \" ' < > , . ? / \\ | ` ~   ";
  const result = await hashLockPassword(password);
  const valid = await verifyLockPassword(password, result.hash, result.salt);
  assert.equal(valid, true);

  const wrong = await verifyLockPassword("p@ss w0rd", result.hash, result.salt);
  assert.equal(wrong, false);
});

test("hashLockPassword accepts Unicode, Cyrillic, Chinese, Arabic, and Emoji characters", async () => {
  const unicodePasswords = [
    "🔑🔒🛡️✨ NextNotePad! 🚀",
    "пароль-для-блокировки-123",
    "密碼鎖定-測試-2026",
    "كلمة_المرور_المشفرة",
    "élan-vital-über-morgen-café",
    "こんにちは世界！🔒",
  ];

  for (const pw of unicodePasswords) {
    const result = await hashLockPassword(pw);
    assert.ok(result.hash.length > 0);
    assert.ok(result.salt.length > 0);

    const valid = await verifyLockPassword(pw, result.hash, result.salt);
    assert.equal(valid, true, `Failed for unicode password: ${pw}`);

    const invalid = await verifyLockPassword(`${pw}_wrong`, result.hash, result.salt);
    assert.equal(invalid, false, `Should have failed for: ${pw}_wrong`);
  }
});

test("hashLockPassword uses random salts (different hashes for identical password)", async () => {
  const pw = "identical_password";
  const r1 = await hashLockPassword(pw);
  const r2 = await hashLockPassword(pw);

  assert.notEqual(r1.salt, r2.salt, "Salts must be randomly generated and unique");
  assert.notEqual(r1.hash, r2.hash, "Hashes must differ because salts differ");

  // Both still verify correctly against the same password
  assert.equal(await verifyLockPassword(pw, r1.hash, r1.salt), true);
  assert.equal(await verifyLockPassword(pw, r2.hash, r2.salt), true);
});

test("hashLockPassword rejects empty strings", async () => {
  await assert.rejects(async () => {
    await hashLockPassword("");
  });
});

test("verifyLockPassword returns false for invalid/tampered parameters", async () => {
  const result = await hashLockPassword("testpass");

  // Tampered salt
  assert.equal(await verifyLockPassword("testpass", result.hash, "tamperedsalt1234"), false);

  // Tampered hash (same length, different content)
  const tamperedHash = "a".repeat(result.hash.length);
  assert.equal(await verifyLockPassword("testpass", tamperedHash, result.salt), false);

  // Different length hash
  assert.equal(await verifyLockPassword("testpass", "short", result.salt), false);

  // Empty inputs
  assert.equal(await verifyLockPassword("", result.hash, result.salt), false);
  assert.equal(await verifyLockPassword("testpass", "", result.salt), false);
  assert.equal(await verifyLockPassword("testpass", result.hash, ""), false);
});

test("signUnlockToken and verifyUnlockToken work correctly", async () => {
  const token = await signUnlockToken({
    userId: "user_12345",
    policy: "next_visit",
  });

  assert.ok(token);
  assert.equal(typeof token, "string");

  const payload = await verifyUnlockToken(token);
  assert.ok(payload);
  assert.equal(payload.userId, "user_12345");
  assert.equal(payload.policy, "next_visit");
  assert.equal(payload.unlockedDate, getTodayDateString());
  assert.ok(typeof payload.unlockedAt === "number");
});

test("verifyUnlockToken rejects tampered tokens", async () => {
  const validToken = await signUnlockToken({
    userId: "user_valid",
    policy: "next_visit",
  });

  const tamperedToken = `${validToken.slice(0, -6)}xxxxxx`;
  const result = await verifyUnlockToken(tamperedToken);
  assert.equal(result, null);

  const garbageToken = "not.a.valid.jwt.token";
  assert.equal(await verifyUnlockToken(garbageToken), null);

  const emptyToken = "";
  assert.equal(await verifyUnlockToken(emptyToken), null);
});

test("getTodayDateString returns UTC date in YYYY-MM-DD format", () => {
  const dateStr = getTodayDateString();
  assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/);
});

test("new_day policy detects date transitions", async () => {
  // Token signed for "yesterday"
  const yesterdayToken = await signUnlockToken({
    userId: "user_test_day",
    policy: "new_day",
    unlockedDate: "2020-01-01",
  });

  const payload = await verifyUnlockToken(yesterdayToken);
  assert.ok(payload);
  assert.equal(payload.unlockedDate, "2020-01-01");

  const today = getTodayDateString();
  const isExpiredDay = payload.unlockedDate !== today;
  assert.equal(isExpiredDay, true, "Token with older date should be identified as expired day");
});
