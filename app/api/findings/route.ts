import prisma from "@/lib/prisma";
import { findingSchemaCompleted } from "@/schemas/finding";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const body = await req.json();
  const parseResult = findingSchemaCompleted.safeParse(body);

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!parseResult.success) {
    return Response.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parseResult.data;

  const finding = await prisma.finding.create({
    data: {
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      depth: data.depth,
      weight: data.weight,
      diameter: data.diameter,
      description: data.description,
      description_front: data.description_front,
      description_back: data.description_back,
      dating: data.dating,
      dating_from: data.dating_from,
      dating_to: data.dating_to,
      references: data.references,
      foundAt: data.foundAt,
      user: {
        connect: {
          id: session.user.id,
        },
      },
      images: {
        connect: data.images.map((imageId) => ({ id: imageId })),
      },
      tags: {
        connect: data.selectedTags.map((tag) => ({ id: tag.id })),
      },
    },
  });

  return NextResponse.json({ finding }, { status: 201 });
}
