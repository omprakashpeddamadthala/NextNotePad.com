import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { getAiConfigStatus, updateAiConfig } from "@/lib/ai/appConfig";
import { updateAiConfigSchema } from "@/lib/validation/aiSchemas";
import { badRequest, forbidden } from "@/lib/api/respond";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const status = await getAiConfigStatus();
  return NextResponse.json(status);
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const parsed = updateAiConfigSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);

  await updateAiConfig(parsed.data);
  const status = await getAiConfigStatus();
  return NextResponse.json(status);
}
