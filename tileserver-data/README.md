# Tileserver GL - Bangladesh Tiles Setup

This directory contains the tile data for Tileserver GL.

## Getting Bangladesh MBTiles

You need to download a Bangladesh-only MBTiles file and place it here.

### Option 1: Download Pre-made Bangladesh MBTiles (Easiest)

Download from one of these sources:

1. **Geofabrik** (Most reliable for OSM data):
   - Visit: https://download.geofabrik.de/asia/bangladesh.html
   - Download the `.osm.pbf` file
   - Use `tippecanoe` to convert to MBTiles:
   ```bash
   docker run -v $(pwd):/data mapnik/mapnik:latest bash -c "
   apt-get update && apt-get install -y tippecanoe &&
   tippecanoe -o /data/bangladesh.mbtiles -z 14 -Z 0 --name=bangladesh --layer=osm /data/bangladesh.osm.pbf
   "
   ```

2. **Pre-converted MBTiles**:
   - Check if there's a public repository with pre-made Bangladesh MBTiles
   - Download directly to this directory as `bangladesh.mbtiles`

### Option 2: Use Docker to Generate

```bash
# Download OSM data
wget https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf

# Convert using Docker
docker run -v $(pwd):/data mapnik/mapnik:latest tippecanoe -o /data/bangladesh.mbtiles -z 14 /data/bangladesh-latest.osm.pbf
```

## File Structure

```
tileserver-data/
├── config.json           # Tileserver configuration
├── bangladesh.mbtiles    # <-- Place your Bangladesh MBTiles file here
├── styles/
│   └── bright.json      # Map style (optional)
├── fonts/               # Font files (optional)
└── sprites/             # Sprite sheets (optional)
```

## Running with Docker Compose

Once you have `bangladesh.mbtiles` in place:

```bash
docker compose up --build
```

The tile server will be available at:
- `http://localhost:8080` - Tileserver GL interface
- `http://localhost:8080/data/bangladesh` - Bangladesh tiles
- `http://localhost:8080/styles/osm-bright` - Map style

## Notes

- Tileserver GL only loads Bangladesh tiles
- The frontend will use `http://localhost:8080/styles/osm-bright/style.json`
- Map bounds are restricted to Bangladesh coordinates
- No world tiles are loaded, optimizing performance
