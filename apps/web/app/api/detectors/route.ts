import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const detectors = await prisma.detector.findMany({
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ detectors });
}
