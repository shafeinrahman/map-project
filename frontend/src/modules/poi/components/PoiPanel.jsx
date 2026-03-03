import { useEffect, useState } from 'react'
import { poiApi } from '../../../shared/services/api/poiApi'

export function PoiPanel({ token, permissions }) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [poiName, setPoiName] = useState('')
  const [poiType, setPoiType] = useState('general')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  const canRead = permissions.canRead
  const canWrite = permissions.canWrite

  const loadPois = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await poiApi.list(token)
      setItems(response.items || [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!token || !canRead) {
      setItems([])
      return
    }

    let cancelled = false

    loadPois().catch(() => {
      if (!cancelled) {
        setError('Failed to load POIs.')
      }
    })

    return () => {
      cancelled = true
    }
  }, [token, canRead])

  const handleCreate = async (event) => {
    event.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      await poiApi.create(token, {
        poiName,
        poiType,
        latitude: Number(latitude),
        longitude: Number(longitude),
      })

      setPoiName('')
      setPoiType('general')
      setLatitude('')
      setLongitude('')
      await loadPois()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="card">
      <div className="row-between">
        <h2>Points of Interest</h2>
        <button type="button" onClick={loadPois} disabled={!token || !canRead || isLoading}>
          Refresh
        </button>
      </div>

      {!token ? <p>Login required.</p> : null}
      {token && !canRead ? <p>Your role cannot read POIs.</p> : null}
      {isLoading ? <p>Loading POIs...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {token && canWrite ? (
        <form className="form-inline" onSubmit={handleCreate}>
          <input
            placeholder="POI name"
            value={poiName}
            onChange={(event) => setPoiName(event.target.value)}
          />
          <input
            placeholder="POI type"
            value={poiType}
            onChange={(event) => setPoiType(event.target.value)}
          />
          <input
            placeholder="Latitude"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
          />
          <input
            placeholder="Longitude"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
          />
          <button type="submit" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </form>
      ) : null}

      <ul className="list">
        {items.map((poi) => (
          <li key={poi.poiId}>
            <strong>{poi.poiName}</strong>
            <span>{poi.poiType}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
