import { httpClient } from '../httpClient'

export const businessApi = {
  list: (token) => httpClient.get('/businesses', { token }),
  listGeoJson: (token) => httpClient.get('/businesses/geojson', { token }),
  create: (token, payload) => httpClient.post('/businesses', payload, { token }),
}
