import { useEffect, useMemo, useState } from 'react'
import { businessApi } from '../../../shared/services/api/businessApi'
import { poiApi } from '../../../shared/services/api/poiApi'

const emptyFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

const mergeFeatureCollections = (collections) => {
  return {
    type: 'FeatureCollection',
    features: collections.flatMap((collection) => collection?.features || []),
  }
}

const fetchAllGeoJsonPages = async (loadPage, token) => {
  const pageLimit = 500
  let offset = 0
  let total = null
  const pages = []

  while (true) {
    const response = await loadPage(token, { limit: pageLimit, offset })
    pages.push(response)

    const currentFeatures = response?.features || []
    const pagination = response?.pagination || {}
    const responseLimit = Number(pagination.limit) || pageLimit
    const responseOffset = Number(pagination.offset)

    if (total === null) {
      const responseTotal = Number(pagination.total)
      total = Number.isFinite(responseTotal) ? responseTotal : null
    }

    if (currentFeatures.length === 0) {
      break
    }

    if (total !== null) {
      const nextOffset = (Number.isFinite(responseOffset) ? responseOffset : offset) + responseLimit
      if (nextOffset >= total) {
        break
      }
      offset = nextOffset
      continue
    }

    if (currentFeatures.length < responseLimit) {
      break
    }

    offset += responseLimit
  }

  return mergeFeatureCollections(pages)
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

export function useMapGeoData({ token, canRead, businessStatus }) {
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
          fetchAllGeoJsonPages(businessApi.listGeoJson, token),
          fetchAllGeoJsonPages(poiApi.listGeoJson, token),
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
  }, [token, canRead, reloadKey])

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
