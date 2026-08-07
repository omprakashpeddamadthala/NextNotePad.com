import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { unauthorized } from "@/lib/api/respond";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const failures = await prisma.syncFailure.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    count: failures.length,
    failures: failures.map((f) => ({
      entityType: f.entityType,
      entityId: f.entityId,
      operation: f.operation,
      error: f.error,
      updatedAt: f.updatedAt.getTime(),
    })),
  });
}
