import { httpClient } from '../httpClient'

export const poiApi = {
  list: (token) => httpClient.get('/pois', { token }),
  listGeoJson: (token) => httpClient.get('/pois/geojson', { token }),
  create: (token, payload) => httpClient.post('/pois', payload, { token }),
}
