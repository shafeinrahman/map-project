#!/bin/bash

# Download Bangladesh MBTiles from Geofabrik
# This script downloads the latest Bangladesh OSM data and converts it to MBTiles

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MBTILES_FILE="$SCRIPT_DIR/bangladesh.mbtiles"

echo "=== Bangladesh MBTiles Downloader ==="
echo ""
echo "This script will download OSM data for Bangladesh and convert it to MBTiles format."
echo ""

# Check if mbtiles already exists
if [ -f "$MBTILES_FILE" ]; then
    echo "✓ bangladesh.mbtiles already exists at $MBTILES_FILE"
    echo "  To re-download, delete this file first."
    exit 0
fi

# Check if we have wget or curl
if ! command -v wget &> /dev/null && ! command -v curl &> /dev/null; then
    echo "✗ Error: wget or curl is required."
    exit 1
fi

echo "Downloading Bangladesh OSM data from Geofabrik..."
OSM_FILE="$SCRIPT_DIR/bangladesh-latest.osm.pbf"

if command -v wget &> /dev/null; then
    wget -O "$OSM_FILE" https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf
else
    curl -o "$OSM_FILE" https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf
fi

echo "✓ Downloaded OSM data"
echo ""
echo "Converting to MBTiles format..."
echo ""

# Try local tippecanoe first
if command -v tippecanoe &> /dev/null; then
    echo "Using local tippecanoe..."
    tippecanoe -o "$MBTILES_FILE" -z 14 -Z 0 --name=bangladesh --layer=osm "$OSM_FILE"
    echo "✓ Successfully created bangladesh.mbtiles"
else
    echo "tippecanoe not found locally."
    echo ""
    echo "Options to proceed:"
    echo "1. Install tippecanoe: https://github.com/mapbox/tippecanoe"
    echo "2. Download pre-made MBTiles from a public source"
    echo "3. Use the OSM2MBTiles online tool: https://tileserver.readthedocs.io/"
    echo ""
    echo "For now, you can still start the app with dummy tiles."
    exit 1
fi

echo ""
echo "✓ Successfully created bangladesh.mbtiles"
echo ""
echo "Cleaning up OSM data file..."
rm -f "$OSM_FILE"
echo "✓ Done!"
echo ""
echo "You can now run:"
echo "  docker compose up --build"

