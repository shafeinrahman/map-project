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

export const categoryApi = {
  list: (token, query = {}, options = {}) =>
    httpClient.get(`/categories${toQueryString(query)}`, { token, ...options }),
}
