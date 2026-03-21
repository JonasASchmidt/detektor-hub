import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Row = { geojson: string };

/**
 * Returns the GeoJSON polygon for the finest available admin unit level.
 * Falls back from municipality → county → federal state.
 * Returns null if no match is found (e.g. coordinates outside Germany).
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const municipality = searchParams.get("municipality");
  const county = searchParams.get("county");
  const federalState = searchParams.get("federalState");

  try {
    if (municipality && county) {
      const rows = await prisma.$queryRaw<Row[]>`
        SELECT ST_AsGeoJSON(m.geometry)::text AS geojson
        FROM administrative_units_municipalities m
        JOIN administrative_units_counties c ON m.id_county = c.id_county
        WHERE m.name = ${municipality} AND c.name = ${county}
        LIMIT 1
      `;
      if (rows.length > 0) return NextResponse.json(JSON.parse(rows[0].geojson));
    }

    if (county && federalState) {
      const rows = await prisma.$queryRaw<Row[]>`
        SELECT ST_AsGeoJSON(c.geometry)::text AS geojson
        FROM administrative_units_counties c
        JOIN administrative_units_federal_states fs ON c.id_federal_state = fs.id_federal_state
        WHERE c.name = ${county} AND fs.name = ${federalState}
        LIMIT 1
      `;
      if (rows.length > 0) return NextResponse.json(JSON.parse(rows[0].geojson));
    }

    if (federalState) {
      const rows = await prisma.$queryRaw<Row[]>`
        SELECT ST_AsGeoJSON(geometry)::text AS geojson
        FROM administrative_units_federal_states
        WHERE name = ${federalState}
        LIMIT 1
      `;
      if (rows.length > 0) return NextResponse.json(JSON.parse(rows[0].geojson));
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error("Error fetching admin unit polygon:", error);
    return NextResponse.json(null);
  }
}
