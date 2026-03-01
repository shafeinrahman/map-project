import { httpClient } from '../httpClient'

export const businessApi = {
  list: (token) => httpClient.get('/businesses', { token }),
  create: (token, payload) => httpClient.post('/businesses', payload, { token }),
}
