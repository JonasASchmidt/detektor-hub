import prisma from "@/lib/prisma";
import { findingDraftSchema } from "@/schemas/finding";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACTIVE_SESSION_COOKIE } from "@/app/api/active-session/route";
import { applyNamingScheme } from "@/lib/namingScheme";
import { logActivity } from "@/lib/activityLog";

async function resolveFieldSessionId(
  explicit: string | null | undefined,
  userId: string
): Promise<string | null> {
  if (explicit) return explicit;
  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_SESSION_COOKIE)?.value;
  if (!activeId) return null;
  const exists = await prisma.fieldSession.findFirst({
    where: { id: activeId, userId },
    select: { id: true },
  });
  return exists?.id ?? null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json();
  const parseResult = findingDraftSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parseResult.data;
  const fieldSessionId = await resolveFieldSessionId(data.fieldSessionId, session.user.id);

  // Explicit name takes priority; otherwise auto-generate from session naming scheme
  let name: string | null = data.name?.trim() || null;
  if (!name && fieldSessionId) {
    const fieldSession = await prisma.fieldSession.findUnique({
      where: { id: fieldSessionId },
      select: { name: true, namingScheme: true, _count: { select: { findings: true } } },
    });
    if (fieldSession?.namingScheme) {
      name = applyNamingScheme(
        fieldSession.namingScheme,
        fieldSession.name,
        fieldSession._count.findings + 1,
        data.foundAt ? new Date(data.foundAt) : new Date()
      );
    }
  }

  const finding = await prisma.finding.create({
    data: {
      name,
      latitude: data.location.lat,
      longitude: data.location.lng,
      description: data.description,
      conductivity: data.conductivity,
      foundAt: data.foundAt,
      fieldSessionId,
      userId: session.user.id,
      status: "DRAFT",
      images: {
        connect: data.images.map((id) => ({ id })),
      },
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "finding.create",
    entityType: "finding",
    entityId: finding.id,
    metadata: { name: finding.name ?? undefined, source: "field-mobile" },
  });

  revalidatePath("/dashboard/findings");
  return NextResponse.json({ finding }, { status: 201 });
}
