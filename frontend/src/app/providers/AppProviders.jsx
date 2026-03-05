import { AuthProvider } from '../../modules/auth/context/AuthProvider.jsx'

export function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}
