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
import psycopg

HERE = Path(__file__).parent
LOCAL_FILE = HERE / "DE_VG5000.gpkg"
URL = "https://daten.gdz.bkg.bund.de/produkte/vg/vg5000_0101/aktuell/vg5000_01-01.utm32s.gpkg.ebenen.zip"
GF_CODE_MAINLAND = 9


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    postgres_server: str
    postgres_database: str
    postgres_user: str
    postgres_password: str

    @property
    def postgres_url(self):
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_server}/{self.postgres_database}"


def main() -> None:
    settings = Settings()
    if not LOCAL_FILE.exists():
        response = requests.get(URL)
        zip_file_in_bytes = BytesIO(response.content)
        with ZipFile(zip_file_in_bytes) as z:
            file_in_bytes = z.read("vg5000_01-01.utm32s.gpkg.ebenen/vg5000_ebenen_0101/DE_VG5000.gpkg")
        LOCAL_FILE.write_bytes(file_in_bytes)
    # transformations
    gdf_country = gpd.read_file(LOCAL_FILE, layer="vg5000_sta")
    gdf_country = gdf_country.rename(columns=str.lower)
    gdf_country = gdf_country[gdf_country["gf"] == GF_CODE_MAINLAND]
    gdf_country = gdf_country.to_crs("EPSG:4326")
    gdf_country["id_country"] = 0
    gdf_country = gdf_country.rename(columns={"gen": "name"})
    gdf_country = gdf_country.loc[:, ["id_country", "name", "geometry"]]

    gdf_federal_state = gpd.read_file(LOCAL_FILE, layer="vg5000_lan")
    gdf_federal_state = gdf_federal_state.rename(columns=str.lower)
    gdf_federal_state = gdf_federal_state[gdf_federal_state["gf"] == GF_CODE_MAINLAND]
    gdf_federal_state = gdf_federal_state.to_crs("EPSG:4326")
    gdf_federal_state["id_country"] = 0
    gdf_federal_state = gdf_federal_state.rename(columns={"sn_l": "id_federal_state", "gen": "name"})
    gdf_federal_state = gdf_federal_state.loc[:, ["id_country", "id_federal_state", "name", "geometry"]]

    gdf_county = gpd.read_file(LOCAL_FILE, layer="vg5000_krs")
    gdf_county = gdf_county.rename(columns=str.lower)
    gdf_county = gdf_county[gdf_county["gf"] == GF_CODE_MAINLAND]
    gdf_county = gdf_county.to_crs("EPSG:4326")
    gdf_county = gdf_county.rename(columns={"sn_l": "id_federal_state", "sn_k": "id_county", "gen": "name"})
    gdf_county = gdf_county.loc[:, ["id_federal_state", "id_county", "name", "geometry"]]

    gdf_municipality = gpd.read_file(LOCAL_FILE, layer="vg5000_gem")
    gdf_municipality = gdf_municipality.rename(columns=str.lower)
    gdf_municipality = gdf_municipality[gdf_municipality["gf"] == GF_CODE_MAINLAND]
    gdf_municipality = gdf_municipality.to_crs("EPSG:4326")
    gdf_municipality = gdf_municipality.rename(columns={"sn_k": "id_county", "sn_g": "id_municipality", "gen": "name"})
    gdf_municipality = gdf_municipality.loc[:, ["id_county", "id_municipality", "name", "geometry"]]

    # write to database
    engine = create_engine(settings.postgres_url)

    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))

    gdf_country.to_postgis(
        name="AdministrativeUnitsCountry",
        con=engine,
        if_exists="replace",
        index=False,
        schema="public"
    )

if __name__ == "__main__":
    main()

    from shapely import Point
    import json

    point = Point(
        11.8,
        50.5,
    )
