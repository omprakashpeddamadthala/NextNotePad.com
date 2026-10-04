import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { userToDto } from "@/lib/dto/userDto";
import { forbidden } from "@/lib/api/respond";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(users.map(userToDto));
}
