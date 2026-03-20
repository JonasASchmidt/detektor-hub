import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasCapability } from "@/lib/hasCapability";
import { officialRoleSchema } from "@/schemas/official-role";

// GET /api/official-roles
// ADMIN: returns all roles.
// OFFICIAL with MANAGE_ROLES: returns only roles they created.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const canManage =
    isAdmin || (await hasCapability(session.user.id, "MANAGE_ROLES"));

  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roles = await prisma.officialRole.findMany({
    where: isAdmin ? undefined : { createdByUserId: session.user.id },
    include: {
      scope: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { userRoles: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ roles });
}

// POST /api/official-roles
// Creates a new role. Requires MANAGE_ROLES capability or ADMIN.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const canManage =
    isAdmin || (await hasCapability(session.user.id, "MANAGE_ROLES"));

  if (!canManage) {
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

  const role = await prisma.officialRole.create({
    data: {
      ...roleData,
      createdByUserId: session.user.id,
      scope: {
        create: scopes.map((s) => ({
          adminUnitType: s.adminUnitType,
          adminUnitName: s.adminUnitName,
        })),
      },
    },
    include: { scope: true },
  });

  return NextResponse.json({ role }, { status: 201 });
}
