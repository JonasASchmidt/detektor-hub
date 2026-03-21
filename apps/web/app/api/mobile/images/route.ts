import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { getMobileSession } from "@/lib/mobile-auth";

/**
 * POST /api/mobile/images
 * Accepts a multipart/form-data upload with a "file" field.
 * Uploads to Cloudinary and creates an Image record.
 * Returns: { id, url, publicId }
 */
export async function POST(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Keine Datei übergeben." }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
      bytes: number;
      original_filename: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "detektor-hub" }, (error, result) => {
          if (error || !result) return reject(error);
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            original_filename: result.original_filename,
          });
        })
        .end(buffer);
    });

    const image = await prisma.image.create({
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        originalFilename: file.name || result.original_filename,
        fileSize: result.bytes,
        width: result.width,
        height: result.height,
        user: { connect: { id: session.id } },
      },
    });

    return NextResponse.json({ id: image.id, url: image.url, publicId: image.publicId });
  } catch (err) {
    console.error("Mobile image upload failed:", err);
    return NextResponse.json({ error: "Upload fehlgeschlagen." }, { status: 500 });
  }
}
