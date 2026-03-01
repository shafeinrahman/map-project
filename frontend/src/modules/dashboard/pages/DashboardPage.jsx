import { AuthPanel } from '../../auth/components/AuthPanel.jsx'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { BusinessPanel } from '../../business/components/BusinessPanel.jsx'
import { PoiPanel } from '../../poi/components/PoiPanel.jsx'
import { MapWorkspace } from '../../map/components/MapWorkspace.jsx'

const canReadResources = (user) => {
  if (!user) {
    return false
  }

  return ['admin', 'editor', 'viewer'].includes(user.role)
}

export function DashboardPage() {
  const auth = useAuth()
  const canRead = canReadResources(auth.user)

  return (
    <div className="dashboard-grid">
      <AuthPanel auth={auth} />
      <MapWorkspace />
      <BusinessPanel token={auth.token} canRead={canRead} />
      <PoiPanel token={auth.token} canRead={canRead} />
    </div>
  )
}
