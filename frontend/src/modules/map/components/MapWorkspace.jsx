import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { MapFilters } from './MapFilters.jsx'
import { useMapGeoData } from '../hooks/useMapGeoData.js'

const businessSourceId = 'businesses'
const poiSourceId = 'pois'

export function MapWorkspace({ token, permissions }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const [businessStatus, setBusinessStatus] = useState('all')
  const [poiType, setPoiType] = useState('')
  const [showBusinesses, setShowBusinesses] = useState(true)
  const [showPois, setShowPois] = useState(true)

  const canRead = permissions.canRead

  const {
    businessesGeoJson,
    poisGeoJson,
    rawCounts,
    filteredCounts,
    isLoading,
    error,
  } = useMapGeoData({
    token,
    canRead,
    businessStatus,
    poiType,
  })

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [32.58, 0.35],
      zoom: 9,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      map.addSource(businessSourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addSource(poiSourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'business-points',
        type: 'circle',
        source: businessSourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': '#2563eb',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      })

      map.addLayer({
        id: 'poi-points',
        type: 'circle',
        source: poiSourceId,
        paint: {
          'circle-radius': 5,
          'circle-color': '#f97316',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      })

      setMapLoaded(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      setMapLoaded(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || !map.isStyleLoaded()) {
      return
    }

    const businessSource = map.getSource(businessSourceId)
    if (businessSource) {
      businessSource.setData(businessesGeoJson)
    }

    const poiSource = map.getSource(poiSourceId)
    if (poiSource) {
      poiSource.setData(poisGeoJson)
    }
  }, [businessesGeoJson, poisGeoJson, mapLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getLayer('business-points')) {
      return
    }

    map.setLayoutProperty('business-points', 'visibility', showBusinesses ? 'visible' : 'none')
  }, [showBusinesses])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getLayer('poi-points')) {
      return
    }

    map.setLayoutProperty('poi-points', 'visibility', showPois ? 'visible' : 'none')
  }, [showPois])

  const filteredLabel = useMemo(() => {
    return `${filteredCounts.businesses}/${rawCounts.businesses} businesses · ${filteredCounts.pois}/${rawCounts.pois} POIs`
  }, [filteredCounts, rawCounts])

  return (
    <section className="card">
      <h2>Map Workspace</h2>
      {!token ? <p>Login required for map data.</p> : null}
      {token && !canRead ? <p>Your role cannot read map data.</p> : null}
      {isLoading ? <p>Loading map sources...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <MapFilters
        businessStatus={businessStatus}
        onBusinessStatusChange={setBusinessStatus}
        poiType={poiType}
        onPoiTypeChange={setPoiType}
      />

      <div className="toggle-row">
        <label>
          <input
            type="checkbox"
            checked={showBusinesses}
            onChange={(event) => setShowBusinesses(event.target.checked)}
          />
          Show businesses
        </label>
        <label>
          <input type="checkbox" checked={showPois} onChange={(event) => setShowPois(event.target.checked)} />
          Show POIs
        </label>
      </div>

      <p>{filteredLabel}</p>

      <div className="stats-grid">
        <article className="stat-card">
          <h3>Business Features</h3>
          <p>{filteredCounts.businesses}</p>
        </article>
        <article className="stat-card">
          <h3>POI Features</h3>
          <p>{filteredCounts.pois}</p>
        </article>
      </div>

      <div ref={mapContainerRef} className="map-canvas" />
    </section>
  )
}
