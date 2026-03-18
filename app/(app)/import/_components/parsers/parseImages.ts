import exifr from "exifr";
import { resizeImage } from "@/lib/resizeImage";
import type { FindingImport, ParsedImport } from "./types";

/** Parse a single image file for GPS EXIF data.
 *  Returns null if the image has no GPS coordinates.
 *  Also generates a previewUrl (HEIC is converted to JPEG for display).
 */
export async function parseGeotaggedImage(
  file: File
): Promise<FindingImport | null> {
  try {
    const gps = await exifr.gps(file);
    if (!gps?.latitude || !gps?.longitude) return null;

    // Read date/time from EXIF (DateTimeOriginal preferred over CreateDate)
    const exif = await exifr.parse(file, ["DateTimeOriginal", "CreateDate"]);
    const rawDate = exif?.DateTimeOriginal ?? exif?.CreateDate;
    const foundAt =
      rawDate instanceof Date
        ? rawDate
        : rawDate
        ? new Date(rawDate as string)
        : undefined;

    const name = file.name.replace(/\.[^.]+$/, "");
    const previewUrl = await generatePreviewUrl(file);

    return {
      _id: crypto.randomUUID(),
      _source: "image",
      lat: gps.latitude,
      lng: gps.longitude,
      name,
      foundAt,
      imageFile: file,
      previewUrl,
    };
  } catch {
    return null;
  }
}

/** Parse multiple image files. Non-geotagged images are silently skipped. */
export async function parseGeotaggedImages(
  files: File[]
): Promise<ParsedImport & { skipped: number }> {
  const results = await Promise.all(files.map(parseGeotaggedImage));
  const findings = results.filter((r): r is FindingImport => r !== null);
  return {
    sessions: [],
    findings,
    skipped: files.length - findings.length,
  };
}

/** Creates an object URL suitable for use as an <img src>.
 *  For HEIC/HEIF files (not supported by most browsers), converts to JPEG first.
 */
async function generatePreviewUrl(file: File): Promise<string> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  if (!isHeic) {
    return URL.createObjectURL(file);
  }

  try {
    const heic2any = (await import("heic2any")).default;
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
    const outputBlob = Array.isArray(blob) ? blob[0] : blob;
    return URL.createObjectURL(outputBlob);
  } catch {
    return ""; // No preview on conversion failure
  }
}

/** Prepares an image file for upload to Cloudinary:
 *  1. Converts HEIC/HEIF → JPEG (browsers can't upload raw HEIC to Cloudinary reliably)
 *  2. Resizes to max 1920px on the longest edge at 82% JPEG quality
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  let uploadFile = file;

  if (isHeic) {
    try {
      const heic2any = (await import("heic2any")).default;
      const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
      const outputBlob = Array.isArray(blob) ? blob[0] : blob;
      const jpegName = file.name.replace(/\.[^.]+$/, ".jpg");
      uploadFile = new File([outputBlob], jpegName, { type: "image/jpeg" });
    } catch {
      // Conversion failed — fall back to original and let Cloudinary handle it
    }
  }

  return resizeImage(uploadFile);
}
