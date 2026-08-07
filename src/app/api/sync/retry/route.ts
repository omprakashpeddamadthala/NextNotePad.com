import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { retrySyncFailure } from "@/lib/drive/pushSync";
import { unauthorized } from "@/lib/api/respond";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const failures = await prisma.syncFailure.findMany({ where: { userId: user.id } });
  for (const failure of failures) {
    await retrySyncFailure(failure);
  }

  const remaining = await prisma.syncFailure.count({ where: { userId: user.id } });
  return NextResponse.json({ retried: failures.length, remaining });
}
