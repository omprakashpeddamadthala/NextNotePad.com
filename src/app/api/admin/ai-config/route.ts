import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { getAiConfigStatus, updateAiConfig } from "@/lib/ai/appConfig";
import { updateAiConfigSchema } from "@/lib/validation/aiSchemas";
import { forbidden } from "@/lib/api/respond";
import { parseJsonBody } from "@/lib/api/requestBody";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const status = await getAiConfigStatus();
  return NextResponse.json(status);
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return forbidden();

  const parsed = await parseJsonBody(request, updateAiConfigSchema);
  if (!parsed.success) return parsed.response;

  await updateAiConfig(parsed.data);
  const status = await getAiConfigStatus();
  return NextResponse.json(status);
}
