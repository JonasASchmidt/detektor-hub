import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") ?? "50"));
  const entityType = searchParams.get("entityType") ?? undefined;
  const isAdmin = (session.user as any).role === "ADMIN";

  const where: any = {};
  if (!isAdmin) {
    where.OR = [{ userId: session.user.id }, { entityOwnerId: session.user.id }];
  }
  if (entityType) where.entityType = entityType;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pageSize });
}
