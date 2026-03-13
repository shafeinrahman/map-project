import { useState } from 'react'
import { useAuthContext } from '../../auth/context/useAuthContext.js'
import { getRoleCapabilities } from '../../auth/utils/permissions.js'
import { BusinessPanel } from '../../business/components/BusinessPanel.jsx'
import { PoiPanel } from '../../poi/components/PoiPanel.jsx'

export function DatabasePage() {
  const { token, user } = useAuthContext()
  const permissions = getRoleCapabilities(user)
  const [tab, setTab] = useState('businesses')

  return (
    <div className="page-content">
      <div className="tab-bar">
        <button
          type="button"
          className={`tab-bar__btn${tab === 'businesses' ? ' tab-bar__btn--active' : ''}`}
          onClick={() => setTab('businesses')}
        >
          Businesses
        </button>
        <button
          type="button"
          className={`tab-bar__btn${tab === 'pois' ? ' tab-bar__btn--active' : ''}`}
          onClick={() => setTab('pois')}
        >
          Points of Interest
        </button>
      </div>

      {tab === 'businesses' ? (
        <BusinessPanel token={token} permissions={permissions} />
      ) : (
        <PoiPanel token={token} permissions={permissions} />
      )}
    </div>
  )
}

export default DatabasePage
