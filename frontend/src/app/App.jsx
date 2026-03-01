import { AppProviders } from './providers/AppProviders.jsx'
import { MainLayout } from '../shared/layout/MainLayout.jsx'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage.jsx'

function App() {
  return (
    <AppProviders>
      <MainLayout>
        <DashboardPage />
      </MainLayout>
    </AppProviders>
  )
}

export default App
