"""This script creates a table with administrative areas for Germany including levels
- country (only Germany)
- federal state
- county
- municipality
The table has shape information which can be used to find intersections with coordinates.

The script needs to be executed with uv (https://docs.astral.sh/uv/) like uv run [...].py.
Dependencies can be added with uv add --script ... ...
"""

# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "geoalchemy2",
#     "geopandas",
#     "psycopg2-binary",
#     "pydantic-settings",
#     "requests",
#     "shapely",
#     "sqlalchemy",
# ]
# ///
# geopackage file for Germany Country > municipality
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine

import requests
from io import BytesIO
from pathlib import Path
import geopandas as gpd
from zipfile import ZipFile

HERE = Path(__file__).parent
LOCAL_FILE = HERE / "DE_VG5000.gpkg"
URL = "https://daten.gdz.bkg.bund.de/produkte/vg/vg5000_0101/aktuell/vg5000_01-01.utm32s.gpkg.ebenen.zip"
GF_CODE_MAINLAND = 9


class Settings(BaseSettings):
    # Reads POSTGRES_URL_NON_POOLING from .env.local (direct connection, required for PostGIS writes)
    model_config = SettingsConfigDict(env_file=".env.local", case_sensitive=False, extra="ignore")

    postgres_url_non_pooling: str


def load_layer(
    filepath: Path,
    layer: str,
    renames: dict[str, str],
    columns: list[str],
    const_cols: dict | None = None,
    cast_cols: dict | None = None,
) -> gpd.GeoDataFrame:
    """Read a VG5000 layer, filter to mainland Germany, reproject to WGS84, and reshape."""
    gdf = gpd.read_file(filepath, layer=layer)
    gdf = gdf.rename(columns=str.lower)
    gdf = gdf[gdf["gf"] == GF_CODE_MAINLAND]
    gdf = gdf.to_crs("EPSG:4326")
    if const_cols:
        for col, val in const_cols.items():
            gdf[col] = val
    gdf = gdf.rename(columns=renames)
    gdf = gdf.loc[:, columns]
    if cast_cols:
        gdf = gdf.astype(cast_cols)
    return gdf


def write_layer(gdf: gpd.GeoDataFrame, engine, table_name: str) -> None:
    gdf.to_postgis(name=table_name, con=engine, if_exists="replace", index=False, schema="public")


def main() -> None:
    settings = Settings()
    if not LOCAL_FILE.exists():
        response = requests.get(URL)
        zip_file_in_bytes = BytesIO(response.content)
        with ZipFile(zip_file_in_bytes) as z:
            file_in_bytes = z.read("vg5000_01-01.utm32s.gpkg.ebenen/vg5000_ebenen_0101/DE_VG5000.gpkg")
        LOCAL_FILE.write_bytes(file_in_bytes)

    gdf_country = load_layer(
        LOCAL_FILE, "vg5000_sta",
        renames={"gen": "name"},
        columns=["id_country", "name", "geometry"],
        const_cols={"id_country": 0},
    )
    gdf_federal_state = load_layer(
        LOCAL_FILE, "vg5000_lan",
        renames={"sn_l": "id_federal_state", "gen": "name"},
        columns=["id_country", "id_federal_state", "name", "geometry"],
        const_cols={"id_country": 0},
        cast_cols={"id_federal_state": int},
    )
    gdf_county = load_layer(
        LOCAL_FILE, "vg5000_krs",
        renames={"sn_l": "id_federal_state", "sn_k": "id_county", "gen": "name"},
        columns=["id_federal_state", "id_county", "name", "geometry"],
        cast_cols={"id_federal_state": int, "id_county": int},
    )
    gdf_municipality = load_layer(
        LOCAL_FILE, "vg5000_gem",
        renames={"sn_k": "id_county", "sn_g": "id_municipality", "gen": "name"},
        columns=["id_county", "id_municipality", "name", "geometry"],
        cast_cols={"id_county": int, "id_municipality": int},
    )

    engine = create_engine(settings.postgres_url_non_pooling)
    write_layer(gdf_country, engine, "administrative_units_country")
    write_layer(gdf_federal_state, engine, "administrative_units_federal_states")
    write_layer(gdf_county, engine, "administrative_units_counties")
    write_layer(gdf_municipality, engine, "administrative_units_municipalities")

if __name__ == "__main__":
    main()
