import { httpClient } from '../httpClient'

export const authApi = {
  login: (credentials) => httpClient.post('/auth/login', credentials),
  me: (token) => httpClient.get('/auth/me', { token }),
}
