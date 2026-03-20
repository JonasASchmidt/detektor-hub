import { lookupAdminUnits } from "@/lib/geo";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
    return NextResponse.json({ error: "lat and lon need to be valid numbers" }, { status: 400 });
  }
  if (parsedLat < -90 || parsedLat > 90) {
    return NextResponse.json({ error: "lat needs to be between -90 and 90" }, { status: 400 });
  }
  if (parsedLon < -180 || parsedLon > 180) {
    return NextResponse.json({ error: "lon needs to be between -180 and 180" }, { status: 400 });
  }

  const result = await lookupAdminUnits(parsedLat, parsedLon);
  return NextResponse.json(result);
}
