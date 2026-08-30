import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { userToDto } from "@/lib/dto/userDto";

/** Admin-only user list for the Admin Panel — see src/lib/auth/admin.ts for who qualifies as
 *  admin. Never returns googleAccessToken/googleRefreshToken (see userToDto). */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(users.map(userToDto));
}
