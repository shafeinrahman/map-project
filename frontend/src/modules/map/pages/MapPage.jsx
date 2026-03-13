import { useAuthContext } from '../../auth/context/useAuthContext.js'
import { MapWorkspace } from '../components/MapWorkspace.jsx'

export function MapPage() {
  const { token } = useAuthContext()

  return (
    <div className="page-content">
      <MapWorkspace token={token} />
    </div>
  )
}

export default MapPage
