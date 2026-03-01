import { useEffect, useMemo, useState } from 'react'
import { authApi } from '../../../shared/services/api/authApi'

const TOKEN_STORAGE_KEY = 'internalMaps.accessToken'

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    let cancelled = false

    const loadCurrentUser = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await authApi.me(token)
        if (!cancelled) {
          setUser(response.user)
        }
      } catch (requestError) {
        if (!cancelled) {
          setToken('')
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setUser(null)
          setError(requestError.message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadCurrentUser()

    return () => {
      cancelled = true
    }
  }, [token])

  const login = async ({ email, password }) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await authApi.login({ email, password })
      localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken)
      setToken(response.accessToken)
      setUser(response.user)
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setUser(null)
    setError('')
  }

  return useMemo(
    () => ({
      token,
      user,
      isLoading,
      error,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [token, user, isLoading, error],
  )
}
