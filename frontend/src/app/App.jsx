import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './providers/AppProviders.jsx'
import { MainLayout } from '../shared/layout/MainLayout.jsx'
import { ErrorBoundary } from '../shared/components/ErrorBoundary.jsx'
import { useAuthContext } from '../modules/auth/context/useAuthContext.js'

const DashboardPage = lazy(() => import('../modules/dashboard/pages/DashboardPage.jsx'))
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage.jsx'))
const ProfilePage = lazy(() => import('../modules/auth/pages/ProfilePage.jsx'))

function RequireAuth({ children }) {
  const auth = useAuthContext()

  if (auth.token && auth.isLoading && !auth.user) {
    return <section className="card">Loading your account...</section>
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RedirectIfAuthenticated({ children }) {
  const auth = useAuthContext()

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  const auth = useAuthContext()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <Suspense fallback={<section className="card">Loading login...</section>}>
                <LoginPage />
              </Suspense>
            </RedirectIfAuthenticated>
          }
        />

        <Route
          path="/"
          element={
            <RequireAuth>
              <MainLayout auth={auth}>
                <Suspense fallback={<section className="card">Loading dashboard...</section>}>
                  <DashboardPage />
                </Suspense>
              </MainLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <MainLayout auth={auth}>
                <Suspense fallback={<section className="card">Loading profile...</section>}>
                  <ProfilePage />
                </Suspense>
              </MainLayout>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </AppProviders>
  )
}

export default App
