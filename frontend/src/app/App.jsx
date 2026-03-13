import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './providers/AppProviders.jsx'
import { MainLayout } from '../shared/layout/MainLayout.jsx'
import { ErrorBoundary } from '../shared/components/ErrorBoundary.jsx'
import { useAuthContext } from '../modules/auth/context/useAuthContext.js'

const DashboardPage = lazy(() => import('../modules/dashboard/pages/DashboardPage.jsx'))
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage.jsx'))
const ProfilePage = lazy(() => import('../modules/auth/pages/ProfilePage.jsx'))
const InboxPage = lazy(() => import('../modules/admin/pages/InboxPage.jsx'))
const DatabasePage = lazy(() => import('../modules/admin/pages/DatabasePage.jsx'))
const MapPage = lazy(() => import('../modules/map/pages/MapPage.jsx'))
const DeliveryPage = lazy(() => import('../modules/delivery/pages/DeliveryPage.jsx'))

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

function RequireRole({ roles, children }) {
  const auth = useAuthContext()

  if (!roles.includes(auth.user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  const auth = useAuthContext()
  const isDelivery = auth.user?.role === 'delivery'

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<section className="card">Loading login...</section>}>
              <LoginPage />
            </Suspense>
          }
        />

        <Route
          path="/"
          element={
            <RequireAuth>
              <MainLayout auth={auth} fullBleed={isDelivery}>
                <Suspense fallback={<section className="card">Loading dashboard...</section>}>
                  <DashboardPage />
                </Suspense>
              </MainLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/inbox"
          element={
            <RequireAuth>
              <RequireRole roles={['super-admin']}>
                <MainLayout auth={auth} fullBleed>
                  <Suspense fallback={<section className="card">Loading inbox...</section>}>
                    <InboxPage />
                  </Suspense>
                </MainLayout>
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/map"
          element={
            <RequireAuth>
              <MainLayout auth={auth}>
                <Suspense fallback={<section className="card">Loading map...</section>}>
                  <MapPage />
                </Suspense>
              </MainLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/database"
          element={
            <RequireAuth>
              <RequireRole roles={['super-admin', 'business-admin']}>
                <MainLayout auth={auth}>
                  <Suspense fallback={<section className="card">Loading database...</section>}>
                    <DatabasePage />
                  </Suspense>
                </MainLayout>
              </RequireRole>
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

        <Route
          path="/delivery"
          element={
            <RequireAuth>
              <RequireRole roles={['delivery']}>
                <MainLayout auth={auth} fullBleed>
                  <Suspense fallback={<section className="card">Loading delivery...</section>}>
                    <DeliveryPage token={auth.token} />
                  </Suspense>
                </MainLayout>
              </RequireRole>
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
