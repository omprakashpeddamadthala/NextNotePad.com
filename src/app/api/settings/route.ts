import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { updateSettingsSchema } from "@/lib/validation/workspaceSchemas";
import { unauthorized, badRequest } from "@/lib/api/respond";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  if (!settings) return NextResponse.json({ theme: null, json: null });

  return NextResponse.json({ theme: settings.theme, json: settings.json });
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const parsed = updateSettingsSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);

  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: { theme: parsed.data.theme, json: parsed.data.json },
    create: { userId: user.id, theme: parsed.data.theme, json: parsed.data.json },
  });

  return NextResponse.json({ theme: settings.theme, json: settings.json });
}
