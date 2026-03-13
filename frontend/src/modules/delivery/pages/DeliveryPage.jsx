import { useState } from 'react'
import { DeliveryTasksSidebar } from '../components/DeliveryTasksSidebar.jsx'
import { DeliveryMapView } from '../components/DeliveryMapView.jsx'
import { DeliveryAddEntryModal } from '../components/DeliveryAddEntryModal.jsx'

export function DeliveryPage({ token }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="delivery-layout">
      <DeliveryTasksSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="delivery-map-area">
        <div className="delivery-search-bar">
          <input
            type="search"
            placeholder="Search the map..."
            aria-label="Search the map"
          />
        </div>

        <div className="delivery-map-container">
          <DeliveryMapView />

          <button
            type="button"
            className="delivery-fab"
            onClick={() => setModalOpen(true)}
            aria-label="Suggest a new map entry"
            title="Suggest a new map entry"
          >
            +
          </button>
        </div>
      </div>

      <DeliveryAddEntryModal
        token={token}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </div>
  )
}

export default DeliveryPage
