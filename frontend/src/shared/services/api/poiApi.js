import { httpClient } from '../httpClient'

const toQueryString = (query = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const serialized = searchParams.toString()
  return serialized ? `?${serialized}` : ''
}

export const poiApi = {
  list: (token, query = {}) => httpClient.get(`/pois${toQueryString(query)}`, { token }),
  listGeoJson: (token, query = {}) => httpClient.get(`/pois/geojson${toQueryString(query)}`, { token }),
  create: (token, payload) => httpClient.post('/pois', payload, { token }),
  update: (token, poiId, payload) => httpClient.patch(`/pois/${poiId}`, payload, { token }),
  remove: (token, poiId) => httpClient.delete(`/pois/${poiId}`, { token }),
}
