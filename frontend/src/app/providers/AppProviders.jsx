import { AuthProvider } from '../../modules/auth/context/AuthProvider.jsx'
import { ThemeProvider } from '../../shared/context/ThemeContext.jsx'

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
