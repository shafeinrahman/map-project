import { lazy, Suspense } from 'react'
import { AppProviders } from './providers/AppProviders.jsx'
import { MainLayout } from '../shared/layout/MainLayout.jsx'
import { ErrorBoundary } from '../shared/components/ErrorBoundary.jsx'

const DashboardPage = lazy(() => import('../modules/dashboard/pages/DashboardPage.jsx'))

function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <MainLayout>
          <Suspense fallback={<section className="card">Loading dashboard...</section>}>
            <DashboardPage />
          </Suspense>
        </MainLayout>
      </ErrorBoundary>
    </AppProviders>
  )
}

export default App
