import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { publicId, url } = await req.json();

  if (!session || !session.user?.id || !url) {
    return NextResponse.json(
      { error: "Unauthorized or missing data." },
      { status: 401 }
    );
  }

  const image = await prisma.image.create({
    data: {
      publicId,
      url,
      user: {
        connect: {
          id: session.user.id,
        },
      },
    },
  });

  return NextResponse.json(image);
}
