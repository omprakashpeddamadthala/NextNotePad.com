import { getSessionUser } from "./session";

/** Resolves the signed-in session user only if their email matches ADMIN_EMAIL — the sole gate
 *  on reading/writing the shared AI provider config (Settings > AI Config). Returns null for a
 *  guest, a signed-in non-admin user, or a deployment that hasn't set ADMIN_EMAIL at all (i.e.
 *  the feature is off by default, not open to whoever signs in first). */
export async function getAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return null;

  const user = await getSessionUser();
  if (!user || user.email.toLowerCase() !== adminEmail.toLowerCase()) return null;

  return user;
}
