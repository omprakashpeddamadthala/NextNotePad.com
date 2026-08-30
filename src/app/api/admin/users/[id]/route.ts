import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, isBootstrapAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { updateUserSchema } from "@/lib/validation/adminSchemas";
import { userToDto } from "@/lib/dto/userDto";
import { badRequest, notFound } from "@/lib/api/respond";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Promote/demote or block/unblock a user — admin-only (see src/lib/auth/admin.ts). Two guard
 *  rails keep this from ever locking every admin out of the deployment: an admin can't block
 *  themselves, and nobody can block the bootstrap ADMIN_EMAIL account (it's always admin
 *  regardless of the isAdmin flag, so demoting it is harmless and left unguarded). */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const parsed = updateUserSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest(parsed.error);

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return notFound("User not found");

  if (parsed.data.blocked === true) {
    if (target.id === admin.id) {
      return NextResponse.json(
        { error: "You can't block yourself." },
        { status: 400 },
      );
    }
    if (isBootstrapAdmin(target.email)) {
      return NextResponse.json(
        { error: "The primary admin account can't be blocked." },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.isAdmin !== undefined && {
        isAdmin: parsed.data.isAdmin,
      }),
      ...(parsed.data.blocked !== undefined && {
        blocked: parsed.data.blocked,
      }),
    },
  });

  return NextResponse.json(userToDto(updated));
}
