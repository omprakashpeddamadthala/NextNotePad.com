import { getSessionUser } from "./session";

/** Falls back to this email when `ADMIN_EMAIL` isn't set, so the app has a working admin out of
 *  the box instead of the feature being silently off. This account is always treated as admin
 *  (see `isBootstrapAdmin`) and can never be blocked or demoted through the Admin Panel — the
 *  one account that can't lock itself out. */
const ADMIN_EMAIL_DEFAULT = "omprakashornold@gmail.com";

function adminEmail(): string {
  return (process.env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT).toLowerCase();
}

/** True for the one permanent, un-demotable, un-blockable admin account. */
export function isBootstrapAdmin(email: string): boolean {
  return email.toLowerCase() === adminEmail();
}

/** Resolves the signed-in session user only if they're an admin — either the bootstrap
 *  `ADMIN_EMAIL` account or a user promoted via `User.isAdmin`. Returns null for a guest or a
 *  signed-in non-admin user. */
export async function getAdminUser() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!isBootstrapAdmin(user.email) && !user.isAdmin) return null;

  return user;
}
