import { getSessionUser } from "./session";

const ADMIN_EMAIL_DEFAULT = "omprakashornold@gmail.com";

function adminEmail(): string {
  return (process.env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT).toLowerCase();
}

export function isBootstrapAdmin(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  return email.toLowerCase() === adminEmail();
}

export async function getAdminUser() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!isBootstrapAdmin(user.email) && !user.isAdmin) return null;

  return user;
}
