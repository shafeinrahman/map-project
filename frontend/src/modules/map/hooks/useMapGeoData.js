import { useEffect, useMemo, useState } from 'react'
import { businessApi } from '../../../shared/services/api/businessApi'
import { poiApi } from '../../../shared/services/api/poiApi'

const emptyFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

const filterBusinessFeatures = (features, businessStatus) => {
  if (businessStatus === 'all') {
    return features
  }

  return features.filter((feature) => feature.properties?.status === businessStatus)
}

/*
const filterPoiFeatures = (features, poiType) => {
  if (!poiType.trim()) {
    return features
  }

  const normalizedType = poiType.trim().toLowerCase()

  return features.filter((feature) => {
    return String(feature.properties?.poiType || '').toLowerCase().includes(normalizedType)
  })
}
*/

export function useMapGeoData({ token, canRead, businessStatus, viewport }) {
  const [rawBusinesses, setRawBusinesses] = useState(emptyFeatureCollection)
  const [rawPois, setRawPois] = useState(emptyFeatureCollection)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState('')

  const reload = () => {
    setReloadKey((current) => current + 1)
  }

  useEffect(() => {
    const hasViewportBounds =
      Number.isFinite(viewport?.minLat) &&
      Number.isFinite(viewport?.maxLat) &&
      Number.isFinite(viewport?.minLng) &&
      Number.isFinite(viewport?.maxLng)

    if (!token || !canRead) {
      setRawBusinesses(emptyFeatureCollection)
      setRawPois(emptyFeatureCollection)
      return
    }

    if (!hasViewportBounds) {
      return
    }

    let cancelled = false

    const loadSources = async () => {
      setIsLoading(true)
      setError('')

      try {
        const boundsQuery = {
          minLat: viewport?.minLat,
          maxLat: viewport?.maxLat,
          minLng: viewport?.minLng,
          maxLng: viewport?.maxLng,
        }

        const businessQuery = {
          ...boundsQuery,
          zoom: viewport?.zoom,
          status: businessStatus === 'all' ? undefined : businessStatus,
        }

        const poiQuery = {
          ...boundsQuery,
          zoom: viewport?.zoom,
        }

        const [businessesGeo, poisGeo] = await Promise.all([
          businessApi.listGeoJson(token, businessQuery),
          poiApi.listGeoJson(token, poiQuery),
        ])

        if (!cancelled) {
          setRawBusinesses(businessesGeo)
          setRawPois(poisGeo)
          setLastUpdatedAt(new Date().toISOString())
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadSources()

    return () => {
      cancelled = true
    }
  }, [token, canRead, reloadKey, viewport, businessStatus])

  const filteredBusinesses = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: filterBusinessFeatures(rawBusinesses.features || [], businessStatus),
    }
  }, [rawBusinesses, businessStatus])

  const filteredPois = useMemo(() => {
    // Search algorithm deferred: POI text-search matching intentionally disabled.
    return {
      type: 'FeatureCollection',
      features: rawPois.features || [],
    }
  }, [rawPois])

  return {
    businessesGeoJson: filteredBusinesses,
    poisGeoJson: filteredPois,
    rawCounts: {
      businesses: rawBusinesses.features?.length || 0,
      pois: rawPois.features?.length || 0,
    },
    filteredCounts: {
      businesses: filteredBusinesses.features.length,
      pois: filteredPois.features.length,
    },
    reload,
    lastUpdatedAt,
    isLoading,
    error,
  }
}
