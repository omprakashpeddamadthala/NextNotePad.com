import type { UserModel } from "@/generated/prisma/models";
import { isBootstrapAdmin } from "@/lib/auth/admin";

function toTimestamp(d: Date | string | number | null | undefined): number {
  if (!d) return Date.now();
  if (d instanceof Date) return d.getTime();
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? Date.now() : t;
}

export function userToDto(user: UserModel) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin,
    isBootstrapAdmin: isBootstrapAdmin(user.email),
    blocked: user.blocked,
    createdAt: toTimestamp(user.createdAt),
  };
}
