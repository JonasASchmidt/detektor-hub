import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const detectors = await prisma.detector.findMany({
    orderBy: [{ company: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ detectors });
}
