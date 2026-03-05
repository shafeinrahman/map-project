import { useAuthContext } from '../../auth/context/useAuthContext.js'
import { getRoleCapabilities } from '../../auth/utils/permissions.js'
import { BusinessPanel } from '../../business/components/BusinessPanel.jsx'
import { PoiPanel } from '../../poi/components/PoiPanel.jsx'
import { MapWorkspace } from '../../map/components/MapWorkspace.jsx'

export function DashboardPage() {
  const auth = useAuthContext()
  const permissions = getRoleCapabilities(auth.user)

  return (
    <div className="dashboard-grid">
      <MapWorkspace token={auth.token} permissions={permissions} />
      <BusinessPanel token={auth.token} permissions={permissions} />
      <PoiPanel token={auth.token} permissions={permissions} />
    </div>
  )
}

export default DashboardPage
