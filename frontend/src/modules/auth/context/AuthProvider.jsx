import { AuthContext } from './auth-context.js'
import { useAuth } from '../hooks/useAuth'

export function AuthProvider({ children }) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}