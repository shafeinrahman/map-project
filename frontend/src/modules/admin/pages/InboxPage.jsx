import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { ZoomBar } from '../../../shared/components/ZoomBar.jsx'
import { useAuthContext } from '../../auth/context/useAuthContext.js'
import { businessApi } from '../../../shared/services/api/businessApi.js'

const PENDING_SOURCE = 'pending-pins'
const PENDING_LAYER = 'pending-pin-points'

export function InboxPage() {
  const { token } = useAuthContext()
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [zoom, setZoom] = useState(6)
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setError('')
    try {
      const response = await businessApi.list(token, {
        status: 'pending_review',
        limit: 100,
        offset: 0,
      })
      setItems(response.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

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
      container: mapContainerRef.current,
      style: mapStyle,
      center: [90.3563, 23.685],
      zoom: 6,
      minZoom: 0,
      maxZoom: 18,
      attributionControl: false,
    })

    map.on('load', () => {
      map.addSource(PENDING_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: PENDING_LAYER,
        type: 'circle',
        source: PENDING_SOURCE,
        paint: {
          'circle-radius': 8,
          'circle-color': '#f97316',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      })

      map.on('click', PENDING_LAYER, (event) => {
        const feature = event.features?.[0]
        if (!feature) return
        const id = Number(feature.properties?.businessId)
        if (id) setSelectedId(id)
      })

      map.on('mouseenter', PENDING_LAYER, () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', PENDING_LAYER, () => {
        map.getCanvas().style.cursor = ''
      })

      map.on('zoomend', () => setZoom(map.getZoom()))

      setMapLoaded(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      setMapLoaded(false)
    }
  }, [])

  // Sync GeoJSON source when items change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const source = map.getSource(PENDING_SOURCE)
    if (!source) return

    source.setData({
      type: 'FeatureCollection',
      features: items
        .filter((item) => item.latitude != null && item.longitude != null)
        .map((item) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [item.longitude, item.latitude] },
          properties: { businessId: item.businessId, name: item.name },
        })),
    })
  }, [items, mapLoaded])

  const flyTo = (item) => {
    if (!mapRef.current || item.latitude == null || item.longitude == null) return
    mapRef.current.flyTo({
      center: [item.longitude, item.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 12),
    })
    setSelectedId(item.businessId)
  }

  const approve = async (businessId) => {
    setActionId(businessId)
    setError('')
    try {
      await businessApi.update(token, businessId, { status: 'active' })
      await load()
      if (selectedId === businessId) setSelectedId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  const reject = async (businessId) => {
    if (!window.confirm('Reject and remove this pin request?')) return
    setActionId(businessId)
    setError('')
    try {
      await businessApi.remove(token, businessId)
      await load()
      if (selectedId === businessId) setSelectedId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="inbox-layout">
      <aside className="inbox-panel">
        <div className="inbox-panel__header">
          <h2>Pin Requests</h2>
          <p className="muted">
            {isLoading ? 'Loading...' : `${items.length} pending`}
          </p>
          {error ? <p className="error">{error}</p> : null}
        </div>

        <ul className="inbox-list">
          {items.length === 0 && !isLoading ? (
            <li>
              <p className="muted inbox-list__empty">No pending requests.</p>
            </li>
          ) : null}

          {items.map((item) => (
            <li
              key={item.businessId}
              className={`inbox-item${selectedId === item.businessId ? ' inbox-item--selected' : ''}`}
              onClick={() => flyTo(item)}
            >
              <span className="inbox-item__name">{item.name || 'Unnamed'}</span>
              <span className="inbox-item__meta">
                {item.addressText || `${item.latitude ?? '?'}, ${item.longitude ?? '?'}`}
              </span>
              <div
                className="inbox-item__actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="inbox-item__btn inbox-item__btn--approve"
                  disabled={actionId === item.businessId}
                  onClick={() => approve(item.businessId)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="inbox-item__btn inbox-item__btn--reject"
                  disabled={actionId === item.businessId}
                  onClick={() => reject(item.businessId)}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <div className="inbox-map">
        <ZoomBar
          zoom={zoom}
          min={0}
          max={18}
          onZoomChange={(z) => mapRef.current?.jumpTo({ zoom: z })}
        />
        <div ref={mapContainerRef} className="inbox-map-canvas" />
      </div>
    </div>
  )
}

export default InboxPage
