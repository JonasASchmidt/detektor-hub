import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/geo/admin-units/list?type=FEDERAL_STATE|COUNTY|MUNICIPALITY&q=<search>
// Returns a list of admin unit names from the PostGIS administrative unit tables.
// - FEDERAL_STATE: returns all 16 Bundesländer (q ignored, results are cached)
// - COUNTY / MUNICIPALITY: requires q (min 1 char), returns up to 20 matches (ILIKE)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.trim() ?? "";

  if (!type || !["FEDERAL_STATE", "COUNTY", "MUNICIPALITY"].includes(type)) {
    return NextResponse.json(
      { error: "type must be FEDERAL_STATE, COUNTY, or MUNICIPALITY" },
      { status: 400 }
    );
  }

  try {
    let names: string[] = [];

    if (type === "FEDERAL_STATE") {
      // Only 16 rows — always return all, no search needed
      const rows = await prisma.$queryRaw<{ name: string }[]>`
        SELECT DISTINCT name
        FROM public.administrative_units_federal_states
        ORDER BY name ASC
      `;
      names = rows.map((r) => r.name);
    } else if (type === "COUNTY") {
      if (q.length < 1) return NextResponse.json({ names: [] });
      const rows = await prisma.$queryRaw<{ name: string }[]>`
        SELECT DISTINCT name
        FROM public.administrative_units_counties
        WHERE name ILIKE ${"%" + q + "%"}
        ORDER BY name ASC
        LIMIT 20
      `;
      names = rows.map((r) => r.name);
    } else {
      // MUNICIPALITY
      if (q.length < 1) return NextResponse.json({ names: [] });
      const rows = await prisma.$queryRaw<{ name: string }[]>`
        SELECT DISTINCT name
        FROM public.administrative_units_municipalities
        WHERE name ILIKE ${"%" + q + "%"}
        ORDER BY name ASC
        LIMIT 20
      `;
      names = rows.map((r) => r.name);
    }

    const headers: HeadersInit =
      type === "FEDERAL_STATE"
        ? { "Cache-Control": "public, max-age=86400" } // static data, cache 24h
        : { "Cache-Control": "private, max-age=60" };

    return NextResponse.json({ names }, { headers });
  } catch (err) {
    console.error("admin-units/list error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
