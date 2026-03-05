import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { MapFilters } from './MapFilters.jsx'
import { useMapGeoData } from '../hooks/useMapGeoData.js'

const businessSourceId = 'businesses'
const poiSourceId = 'pois'
const businessLayerId = 'business-points'
const poiLayerId = 'poi-points'

const createBoundsFromGeoJson = (featureCollection) => {
  const features = featureCollection?.features || []

  if (features.length === 0) {
    return null
  }

  const bounds = new maplibregl.LngLatBounds()

  for (const feature of features) {
    const [lng, lat] = feature?.geometry?.coordinates || []

    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      bounds.extend([lng, lat])
    }
  }

  return bounds.isEmpty() ? null : bounds
}

export function MapWorkspace({ token, permissions }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [viewport, setViewport] = useState({
    zoom: 9,
    minLat: undefined,
    maxLat: undefined,
    minLng: undefined,
    maxLng: undefined,
  })

  const [businessStatus, setBusinessStatus] = useState('all')
  // Search algorithm deferred: POI text-search state intentionally disabled.
  // const [poiType, setPoiType] = useState('')
  const [showBusinesses, setShowBusinesses] = useState(true)
  const [showPois, setShowPois] = useState(true)

  const canRead = permissions.canRead

  const {
    businessesGeoJson,
    poisGeoJson,
    rawCounts,
    filteredCounts,
    reload,
    lastUpdatedAt,
    isLoading,
    error,
  } = useMapGeoData({
    token,
    canRead,
    businessStatus,
    viewport,
    // Search algorithm deferred: pass-through search value removed for now.
    // poiType,
  })

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [90.4048, 23.7700],
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
        id: businessLayerId,
        type: 'circle',
        source: businessSourceId,
        paint: {
          'circle-radius': [
            'case',
            ['has', 'clusterCount'],
            ['interpolate', ['linear'], ['get', 'clusterCount'], 2, 8, 20, 16, 100, 24],
            6,
          ],
          'circle-color': '#2563eb',
          'circle-stroke-width': ['case', ['has', 'clusterCount'], 2, 1],
          'circle-stroke-color': '#ffffff',
        },
      })

      map.addLayer({
        id: poiLayerId,
        type: 'circle',
        source: poiSourceId,
        paint: {
          'circle-radius': [
            'case',
            ['has', 'clusterCount'],
            ['interpolate', ['linear'], ['get', 'clusterCount'], 2, 7, 20, 14, 100, 22],
            5,
          ],
          'circle-color': '#f97316',
          'circle-stroke-width': ['case', ['has', 'clusterCount'], 2, 1],
          'circle-stroke-color': '#ffffff',
        },
      })

      map.on('click', businessLayerId, (event) => {
        const feature = event.features?.[0]
        if (!feature) {
          return
        }

        const [lng, lat] = feature.geometry?.coordinates || []
        const { name, status, clusterCount } = feature.properties || {}

        if (Number(clusterCount) > 1) {
          new maplibregl.Popup({ closeButton: true })
            .setLngLat([lng, lat])
            .setHTML(`<strong>Business cluster</strong><br/>Count: ${Number(clusterCount)}`)
            .addTo(map)
          return
        }

        new maplibregl.Popup({ closeButton: true })
          .setLngLat([lng, lat])
          .setHTML(`<strong>${name || 'Business'}</strong><br/>Status: ${status || 'n/a'}`)
          .addTo(map)
      })

      map.on('click', poiLayerId, (event) => {
        const feature = event.features?.[0]
        if (!feature) {
          return
        }

        const [lng, lat] = feature.geometry?.coordinates || []
        const { poiName, poiType, clusterCount } = feature.properties || {}

        if (Number(clusterCount) > 1) {
          new maplibregl.Popup({ closeButton: true })
            .setLngLat([lng, lat])
            .setHTML(`<strong>POI cluster</strong><br/>Count: ${Number(clusterCount)}`)
            .addTo(map)
          return
        }

        new maplibregl.Popup({ closeButton: true })
          .setLngLat([lng, lat])
          .setHTML(`<strong>${poiName || 'POI'}</strong><br/>Type: ${poiType || 'n/a'}`)
          .addTo(map)
      })

      map.on('mouseenter', businessLayerId, () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', businessLayerId, () => {
        map.getCanvas().style.cursor = ''
      })

      map.on('mouseenter', poiLayerId, () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', poiLayerId, () => {
        map.getCanvas().style.cursor = ''
      })

      const updateViewport = () => {
        const bounds = map.getBounds()
        const zoom = map.getZoom()

        if (!bounds) {
          return
        }

        setViewport({
          zoom,
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        })
      }

      updateViewport()
      map.on('moveend', updateViewport)
      map.on('zoomend', updateViewport)

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
    if (!map || !map.getLayer(businessLayerId)) {
      return
    }

    map.setLayoutProperty(businessLayerId, 'visibility', showBusinesses ? 'visible' : 'none')
  }, [showBusinesses])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getLayer(poiLayerId)) {
      return
    }

    map.setLayoutProperty(poiLayerId, 'visibility', showPois ? 'visible' : 'none')
  }, [showPois])

  const fitToVisibleData = () => {
    const map = mapRef.current
    if (!map) {
      return
    }

    const collections = []
    if (showBusinesses) {
      collections.push(businessesGeoJson)
    }
    if (showPois) {
      collections.push(poisGeoJson)
    }

    const mergedFeatures = collections.flatMap((item) => item.features || [])
    const bounds = createBoundsFromGeoJson({ type: 'FeatureCollection', features: mergedFeatures })

    if (bounds) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 })
    }
  }

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
        // Search algorithm deferred: POI text-search props disabled for now.
        // poiType={poiType}
        // onPoiTypeChange={setPoiType}
      />

      <div className="row-between">
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
            <input
              type="checkbox"
              checked={showPois}
              onChange={(event) => setShowPois(event.target.checked)}
            />
            Show POIs
          </label>
        </div>

        <div className="actions-row">
          <button type="button" onClick={reload} disabled={!token || !canRead || isLoading}>
            Reload sources
          </button>
          <button type="button" onClick={fitToVisibleData} disabled={isLoading}>
            Fit to data
          </button>
        </div>
      </div>

      <p>{filteredLabel}</p>
      {lastUpdatedAt ? <p className="muted">Last updated: {new Date(lastUpdatedAt).toLocaleString()}</p> : null}

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
