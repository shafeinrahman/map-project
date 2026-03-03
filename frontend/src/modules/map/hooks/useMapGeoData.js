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

const filterPoiFeatures = (features, poiType) => {
  if (!poiType.trim()) {
    return features
  }

  const normalizedType = poiType.trim().toLowerCase()

  return features.filter((feature) => {
    return String(feature.properties?.poiType || '').toLowerCase().includes(normalizedType)
  })
}

export function useMapGeoData({ token, canRead, businessStatus, poiType }) {
  const [rawBusinesses, setRawBusinesses] = useState(emptyFeatureCollection)
  const [rawPois, setRawPois] = useState(emptyFeatureCollection)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !canRead) {
      setRawBusinesses(emptyFeatureCollection)
      setRawPois(emptyFeatureCollection)
      return
    }

    let cancelled = false

    const loadSources = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [businessesGeo, poisGeo] = await Promise.all([
          businessApi.listGeoJson(token),
          poiApi.listGeoJson(token),
        ])

        if (!cancelled) {
          setRawBusinesses(businessesGeo)
          setRawPois(poisGeo)
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
  }, [token, canRead])

  const filteredBusinesses = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: filterBusinessFeatures(rawBusinesses.features || [], businessStatus),
    }
  }, [rawBusinesses, businessStatus])

  const filteredPois = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: filterPoiFeatures(rawPois.features || [], poiType),
    }
  }, [rawPois, poiType])

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
    isLoading,
    error,
  }
}
