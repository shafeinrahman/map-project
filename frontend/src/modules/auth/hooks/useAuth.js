import { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../../../shared/services/api/authApi'

const TOKEN_STORAGE_KEY = 'internalMaps.accessToken'
const PROFILE_STORAGE_KEY = 'internalMaps.userProfiles'

const readProfiles = () => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const writeProfiles = (profiles) => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))
}

const normalizeDisplayName = (value, fallbackEmail) => {
  const trimmed = String(value || '').trim()

  if (trimmed) {
    return trimmed
  }

  return String(fallbackEmail || '').split('@')[0] || 'User'
}

const enrichUserProfile = (user) => {
  if (!user) {
    return null
  }

  const profiles = readProfiles()
  const profile = profiles[user.userId] || {}

  return {
    ...user,
    displayName: normalizeDisplayName(profile.displayName, user.email),
  }
}

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
          setUser(enrichUserProfile(response.user))
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

  const login = useCallback(async ({ email, password }) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await authApi.login({ email, password })
      localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken)
      setToken(response.accessToken)
      setUser(enrichUserProfile(response.user))
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setUser(null)
    setError('')
  }, [])

  const updateProfile = useCallback((updates) => {
    if (!user) {
      return
    }

    const nextDisplayName = normalizeDisplayName(updates?.displayName, user.email)
    const nextProfiles = {
      ...readProfiles(),
      [user.userId]: {
        displayName: nextDisplayName,
      },
    }

    writeProfiles(nextProfiles)
    setUser((previousUser) =>
      previousUser
        ? {
            ...previousUser,
            displayName: nextDisplayName,
          }
        : previousUser,
    )
  }, [user])

  return useMemo(
    () => ({
      token,
      user,
      isLoading,
      error,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      updateProfile,
    }),
    [token, user, isLoading, error, login, logout, updateProfile],
  )
}
