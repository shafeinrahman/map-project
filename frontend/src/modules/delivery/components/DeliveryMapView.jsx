import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { ZoomBar } from '../../../shared/components/ZoomBar.jsx'

export function DeliveryMapView() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [zoom, setZoom] = useState(6)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    // Map style with OSM tiles
    const mapStyle = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm-background',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19,
          paint: {
            'raster-opacity': 1,
          },
        },
      ],
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [90.3563, 23.6850],
      zoom: 6,
      minZoom: 0,
      maxZoom: 18,
      attributionControl: false,
    })

    map.on('zoomend', () => setZoom(map.getZoom()))

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <>
      <div ref={containerRef} className="delivery-map-canvas" />
      <ZoomBar
        zoom={zoom}
        min={0}
        max={18}
        onZoomChange={(z) => mapRef.current?.jumpTo({ zoom: z })}
        overlay
      />
    </>
  )
}
