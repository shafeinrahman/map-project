#!/bin/bash
set -e

OUT="/home/raccoon/Documents/work/map project/code repo/tileserver-data/bangladesh.mbtiles"
GEOJSON_DIR="/home/raccoon/Documents/work/map project/code repo/tileserver-data/.geojson"
TMPDIR="/home/raccoon/Documents/work/map project/code repo/tileserver-data/.tippecanoe-tmp"
mkdir -p "$TMPDIR" "$GEOJSON_DIR"

# Move GeoJSON files from /tmp to home partition if not already there
SHP_DIR="/home/raccoon/Documents/work/map project/code repo/bangladesh-260310-free.shp"
for shp in "$SHP_DIR"/*.shp; do
  layer=$(basename "$shp" .shp)
  dest="$GEOJSON_DIR/${layer}.geojson"
  if [ ! -f "$dest" ]; then
    echo "Converting $layer..."
    ogr2ogr -f GeoJSON -t_srs EPSG:4326 "$dest" "$shp"
  fi
done

echo "=== Building Bangladesh MBTiles ==="
echo "Output: $OUT"
echo "Temp dir: $TMPDIR"
echo ""

G="$GEOJSON_DIR"
tippecanoe \
  -o "$OUT" \
  --force \
  --temporary-directory="$TMPDIR" \
  -z 14 -Z 0 \
  --drop-densest-as-needed \
  --simplification=4 \
  --coalesce-smallest-as-needed \
  -L "{\"file\":\"$G/gis_osm_water_a_free_1.geojson\",\"layer\":\"water\"}" \
  -L "{\"file\":\"$G/gis_osm_waterways_free_1.geojson\",\"layer\":\"waterways\"}" \
  -L "{\"file\":\"$G/gis_osm_landuse_a_free_1.geojson\",\"layer\":\"landuse\"}" \
  -L "{\"file\":\"$G/gis_osm_natural_a_free_1.geojson\",\"layer\":\"natural_area\"}" \
  -L "{\"file\":\"$G/gis_osm_natural_free_1.geojson\",\"layer\":\"natural\"}" \
  -L "{\"file\":\"$G/gis_osm_roads_free_1.geojson\",\"layer\":\"roads\"}" \
  -L "{\"file\":\"$G/gis_osm_railways_free_1.geojson\",\"layer\":\"railways\"}" \
  -L "{\"file\":\"$G/gis_osm_places_free_1.geojson\",\"layer\":\"places\"}" \
  -L "{\"file\":\"$G/gis_osm_places_a_free_1.geojson\",\"layer\":\"places_area\"}" \
  -L "{\"file\":\"$G/gis_osm_pois_free_1.geojson\",\"layer\":\"pois\",\"minzoom\":12}" \
  -L "{\"file\":\"$G/gis_osm_pois_a_free_1.geojson\",\"layer\":\"pois_area\",\"minzoom\":12}" \
  -L "{\"file\":\"$G/gis_osm_transport_free_1.geojson\",\"layer\":\"transport\",\"minzoom\":12}" \
  -L "{\"file\":\"$G/gis_osm_transport_a_free_1.geojson\",\"layer\":\"transport_area\",\"minzoom\":12}" \
  -L "{\"file\":\"$G/gis_osm_traffic_free_1.geojson\",\"layer\":\"traffic\",\"minzoom\":13}" \
  -L "{\"file\":\"$G/gis_osm_traffic_a_free_1.geojson\",\"layer\":\"traffic_area\",\"minzoom\":13}" \
  -L "{\"file\":\"$G/gis_osm_pofw_free_1.geojson\",\"layer\":\"pofw\",\"minzoom\":12}" \
  -L "{\"file\":\"$G/gis_osm_pofw_a_free_1.geojson\",\"layer\":\"pofw_area\",\"minzoom\":12}" \
  -L "{\"file\":\"$G/gis_osm_buildings_a_free_1.geojson\",\"layer\":\"buildings\",\"minzoom\":13}"

echo ""
echo "✓ Done! bangladesh.mbtiles created."
ls -lh "$OUT"
