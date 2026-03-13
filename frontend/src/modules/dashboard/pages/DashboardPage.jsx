import { useEffect, useState } from 'react'
import { useAuthContext } from '../../auth/context/useAuthContext.js'
import { getRoleCapabilities } from '../../auth/utils/permissions.js'
import { BusinessPanel } from '../../business/components/BusinessPanel.jsx'
import { PoiPanel } from '../../poi/components/PoiPanel.jsx'
import { MapWorkspace } from '../../map/components/MapWorkspace.jsx'
import { DeliveryPage } from '../../delivery/pages/DeliveryPage.jsx'
import { businessApi } from '../../../shared/services/api/businessApi.js'

function StatTile({ label, value, muted }) {
  return (
    <article className="stat-tile">
      <p className="stat-tile__label">{label}</p>
      <p className={`stat-tile__value${muted ? ' stat-tile__value--muted' : ''}`}>
        {value ?? '—'}
      </p>
    </article>
  )
}

function AdminDashboard({ token }) {
  const [totalBusinesses, setTotalBusinesses] = useState(null)
  const [pendingCount, setPendingCount] = useState(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    businessApi
      .list(token, { limit: 1, offset: 0 })
      .then((r) => { if (!cancelled) setTotalBusinesses(r.pagination?.total ?? 0) })
      .catch(() => { if (!cancelled) setTotalBusinesses(0) })

    businessApi
      .list(token, { status: 'pending_review', limit: 1, offset: 0 })
      .then((r) => { if (!cancelled) setPendingCount(r.pagination?.total ?? 0) })
      .catch(() => { if (!cancelled) setPendingCount(0) })

    return () => { cancelled = true }
  }, [token])

  return (
    <div className="page-content">
      <h2>Dashboard</h2>
      <div className="stat-tile-grid">
        <StatTile label="Total Businesses" value={totalBusinesses} />
        <StatTile label="Pending Pin Requests" value={pendingCount} />
        <StatTile label="Ongoing Deliveries" value={0} muted />
        <StatTile label="Completed Today" value={0} muted />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const auth = useAuthContext()
  const permissions = getRoleCapabilities(auth.user)

  if (auth.user?.role === 'delivery') {
    return <DeliveryPage token={auth.token} permissions={permissions} />
  }

  if (auth.user?.role === 'super-admin') {
    return <AdminDashboard token={auth.token} />
  }

  return (
    <div className="dashboard-grid">
      <MapWorkspace token={auth.token} permissions={permissions} />
      <BusinessPanel token={auth.token} permissions={permissions} />
      <PoiPanel token={auth.token} permissions={permissions} />
    </div>
  )
}

export default DashboardPage
