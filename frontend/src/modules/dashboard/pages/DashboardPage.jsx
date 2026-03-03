import { AuthPanel } from '../../auth/components/AuthPanel.jsx'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { getRoleCapabilities } from '../../auth/utils/permissions.js'
import { BusinessPanel } from '../../business/components/BusinessPanel.jsx'
import { PoiPanel } from '../../poi/components/PoiPanel.jsx'
import { MapWorkspace } from '../../map/components/MapWorkspace.jsx'

export function DashboardPage() {
  const auth = useAuth()
  const permissions = getRoleCapabilities(auth.user)

  return (
    <div className="dashboard-grid">
      <AuthPanel auth={auth} />
      <MapWorkspace token={auth.token} permissions={permissions} />
      <BusinessPanel token={auth.token} permissions={permissions} />
      <PoiPanel token={auth.token} permissions={permissions} />
    </div>
  )
}
