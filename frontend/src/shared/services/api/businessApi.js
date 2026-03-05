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

export const businessApi = {
  list: (token, query = {}) => httpClient.get(`/businesses${toQueryString(query)}`, { token }),
  listGeoJson: (token, query = {}, options = {}) =>
    httpClient.get(`/businesses/geojson${toQueryString(query)}`, { token, ...options }),
  create: (token, payload) => httpClient.post('/businesses', payload, { token }),
  update: (token, businessId, payload) => httpClient.patch(`/businesses/${businessId}`, payload, { token }),
  remove: (token, businessId) => httpClient.delete(`/businesses/${businessId}`, { token }),
}
