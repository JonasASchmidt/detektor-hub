import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasCapability } from "@/lib/hasCapability";
import { officialRoleSchema } from "@/schemas/official-role";

// Shared: fetch role and verify it exists
async function getRole(id: string) {
  return prisma.officialRole.findUnique({
    where: { id },
    include: { scope: true },
  });
}

// Shared: check if the session user may mutate (edit/delete) a role.
// ADMIN can mutate any role; OFFICIAL can only mutate roles they created.
async function canMutate(
  userId: string,
  userRole: string,
  roleCreatorId: string
): Promise<boolean> {
  if (userRole === "ADMIN") return true;
  const canManage = await hasCapability(userId, "MANAGE_ROLES");
  return canManage && roleCreatorId === userId;
}

// GET /api/official-roles/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await getRole(params.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ role });
}

// PUT /api/official-roles/[id]
// Full update: replaces capabilities and scopes entirely.
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await getRole(params.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canMutate(
    session.user.id,
    session.user.role,
    role.createdByUserId
  );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = officialRoleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { scopes, ...roleData } = parsed.data;

  // Replace all scopes atomically
  const updated = await prisma.$transaction([
    prisma.officialRoleScope.deleteMany({ where: { officialRoleId: params.id } }),
    prisma.officialRole.update({
      where: { id: params.id },
      data: {
        ...roleData,
        scope: {
          create: scopes.map((s) => ({
            adminUnitType: s.adminUnitType,
            adminUnitName: s.adminUnitName,
          })),
        },
      },
      include: { scope: true },
    }),
  ]);

  return NextResponse.json({ role: updated[1] });
}

// DELETE /api/official-roles/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await getRole(params.id);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canMutate(
    session.user.id,
    session.user.role,
    role.createdByUserId
  );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Scopes and userRoles cascade on delete (onDelete: Cascade in schema)
  await prisma.officialRole.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
