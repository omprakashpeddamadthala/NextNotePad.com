import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { getAiConfigStatus, updateAiConfig } from "@/lib/ai/appConfig";
import { updateAiConfigSchema } from "@/lib/validation/aiSchemas";
import { badRequest } from "@/lib/api/respond";

/** Admin-only status/update endpoint for the deployment-wide AI provider config (Settings > AI
 *  Config). Gated on ADMIN_EMAIL (see getAdminUser) rather than "any authenticated user" — these
 *  keys are shared across every visitor to this deployment, not per-user. Never returns the keys
 *  themselves, in either direction: GET reports only booleans + (non-secret) model ids, and PUT's
 *  response is the same shape, not an echo of what was submitted. */

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = await getAiConfigStatus();
  return NextResponse.json(status);
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateAiConfigSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);

  await updateAiConfig(parsed.data);
  const status = await getAiConfigStatus();
  return NextResponse.json(status);
}
