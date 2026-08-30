import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isBootstrapAdmin } from "@/lib/auth/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    // UI nicety only (whether to show the Admin Panel menu item) — the real gate is server-side
    // on every /api/admin/* route via getAdminUser().
    isAdmin: user.isAdmin || isBootstrapAdmin(user.email),
  });
}
