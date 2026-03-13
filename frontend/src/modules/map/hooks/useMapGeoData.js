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

export function useMapGeoData({ token, canRead, businessStatus, businessCategoryId, viewport }) {
  const [rawBusinesses, setRawBusinesses] = useState(emptyFeatureCollection)
  const [rawPois, setRawPois] = useState(emptyFeatureCollection)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState('')

  // Bangladesh bounds to restrict queries
  const bangladeshBounds = {
    minLat: 21.5,
    maxLat: 26.2,
    minLng: 88.0,
    maxLng: 92.8,
  }

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
    const abortController = new AbortController()

    const normalizedZoom = Math.max(0, Math.min(18, Math.round(Number(viewport?.zoom) || 0)))

    const loadSources = async () => {
      setIsLoading(true)
      setError('')

      try {
        // Clamp viewport bounds to Bangladesh to prevent loading data outside
        const clampedBounds = {
          minLat: Math.max(viewport?.minLat, bangladeshBounds.minLat),
          maxLat: Math.min(viewport?.maxLat, bangladeshBounds.maxLat),
          minLng: Math.max(viewport?.minLng, bangladeshBounds.minLng),
          maxLng: Math.min(viewport?.maxLng, bangladeshBounds.maxLng),
        }

        const boundsQuery = {
          minLat: clampedBounds.minLat,
          maxLat: clampedBounds.maxLat,
          minLng: clampedBounds.minLng,
          maxLng: clampedBounds.maxLng,
        }

        const businessQuery = {
          ...boundsQuery,
          zoom: normalizedZoom,
          status: businessStatus === 'all' ? undefined : businessStatus,
          categoryId: businessCategoryId === 'all' ? undefined : Number(businessCategoryId),
        }

        const poiQuery = {
          ...boundsQuery,
          zoom: normalizedZoom,
        }

        const [businessesGeo, poisGeo] = await Promise.all([
          businessApi.listGeoJson(token, businessQuery, { signal: abortController.signal }),
          poiApi.listGeoJson(token, poiQuery, { signal: abortController.signal }),
        ])

        if (!cancelled) {
          setRawBusinesses(businessesGeo)
          setRawPois(poisGeo)
          setLastUpdatedAt(new Date().toISOString())
        }
      } catch (requestError) {
        if (requestError?.name === 'AbortError') {
          return
        }

        if (!cancelled) {
          setError(requestError.message)
        }
      } finally {
        if (!cancelled && !abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    const loadTimer = setTimeout(loadSources, 180)

    return () => {
      cancelled = true
      clearTimeout(loadTimer)
      abortController.abort()
    }
  }, [token, canRead, reloadKey, viewport, businessStatus, businessCategoryId])

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
