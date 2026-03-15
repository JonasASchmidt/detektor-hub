import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface AdministrativeUnit {
  country: string;
  federal_state: string;
  county: string;
  municipality: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon are required" },
      { status: 400 }
    );
  }

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
    return NextResponse.json(
      { error: "lat and lon need to be valid numbers" },
      { status: 400 }
    );
  }

  if (parsedLat < -90 || parsedLat > 90) {
    return NextResponse.json(
      { error: "lat needs to be between -90 and 90" },
      { status: 400 }
    );
  }

  if (parsedLon < -180 || parsedLon > 180) {
    return NextResponse.json(
      { error: "lon needs to be between -180 and 180" },
      { status: 400 }
    );
  }

  let result: AdministrativeUnit[];
  try {
    result = await prisma.$queryRaw`
    WITH
        country AS (
            SELECT
                id_country,
                name AS "country"
            FROM
                public."administrative_units_country"
            WHERE ST_Intersects(
                geometry,
                ST_SetSRID(ST_MakePoint(${parsedLon}, ${parsedLat}), 4326)
            )
        ),
        federal_state AS (
            SELECT
                id_country,
                country,
                id_federal_state,
                name AS "federal_state"
            FROM
                public.administrative_units_federal_states states
            JOIN
                country
            USING
                (id_country)
            WHERE ST_Intersects(
                states.geometry,
                ST_SetSRID(ST_MakePoint(${parsedLon}, ${parsedLat}), 4326)
            )
        ),
        county AS (
            SELECT
                id_country,
                country,
                id_federal_state,
                federal_state,
                id_county,
                name AS "county"
            FROM
                public.administrative_units_counties as counties
            JOIN
                federal_state
            USING
                (id_federal_state)
            WHERE ST_Intersects(
                counties.geometry,
                ST_SetSRID(ST_MakePoint(${parsedLon}, ${parsedLat}), 4326)
            )
        ),
        municipality AS (
            SELECT
                id_country,
                country,
                id_federal_state,
                federal_state,
                id_county,
                county,
                id_municipality,
                name AS "municipality"
            FROM
                public.administrative_units_municipalities as municipalities
            JOIN
                county
            USING
                (id_county)
            WHERE ST_Intersects(
                municipalities.geometry,
                ST_SetSRID(ST_MakePoint(${parsedLon}, ${parsedLat}), 4326)
            )
        )

        SELECT
            country,
            federal_state,
            county,
            municipality
        FROM
            municipality
    `;
  } catch {
    return NextResponse.json({});
  }
  if (result.length == 0) {
    return NextResponse.json({});
  }
  // assuming there's only one matching administrative unit, we'll just return the first entry as response
  return NextResponse.json(result[0]);
}
