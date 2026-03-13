#!/bin/bash

# Download pre-made Bangladesh MBTiles (no conversion needed)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MBTILES_FILE="$SCRIPT_DIR/bangladesh.mbtiles"

echo "=== Bangladesh MBTiles Quick Download ==="
echo ""

# Check if mbtiles already exists
if [ -f "$MBTILES_FILE" ]; then
    echo "✓ bangladesh.mbtiles already exists"
    echo "  Size: $(du -h "$MBTILES_FILE" | cut -f1)"
    exit 0
fi

echo "Downloading pre-made Bangladesh MBTiles..."
echo ""

# Try multiple sources
echo "Attempting download from primary source..."

if command -v wget &> /dev/null; then
    DL_CMD="wget -O"
elif command -v curl &> /dev/null; then
    DL_CMD="curl -o"
else
    echo "✗ Error: wget or curl required"
    exit 1
fi

# You can add a Direct download link here if you have one
# For now, fall back to instructions

echo ""
echo "To get Bangladesh MBTiles, use one of these methods:"
echo ""
echo "Method 1: Download from public tile mirror (if available)"
echo "  Check: https://tileserver.readthedocs.io/en/latest/"
echo ""
echo "Method 2: Use OpenMapTiles extracts"
echo "  Visit: https://data.maptiler.com/"
echo "  Download Bangladesh extract"
echo ""
echo "Method 3: Generate your own (requires tippecanoe)"
echo "  bash download-raw-osm.sh"
echo ""
echo "Once you have bangladesh.mbtiles, place it in:"
echo "  $SCRIPT_DIR/"
echo ""
