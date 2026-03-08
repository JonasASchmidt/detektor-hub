import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "No file provided." },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "detektor-hub" },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
          )
          .end(buffer);
      }
    );

    const image = await prisma.image.create({
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        user: { connect: { id: session.user.id } },
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed." },
      { status: 500 }
    );
  }
}
