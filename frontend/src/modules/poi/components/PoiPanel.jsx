import { useEffect, useState } from 'react'
import { poiApi } from '../../../shared/services/api/poiApi'

export function PoiPanel({ token, canRead }) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !canRead) {
      setItems([])
      return
    }

    let cancelled = false

    const loadPois = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await poiApi.list(token)
        if (!cancelled) {
          setItems(response.items || [])
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadPois()

    return () => {
      cancelled = true
    }
  }, [token, canRead])

  return (
    <section className="card">
      <h2>Points of Interest</h2>
      {!token ? <p>Login required.</p> : null}
      {token && !canRead ? <p>Your role cannot read POIs.</p> : null}
      {isLoading ? <p>Loading POIs...</p> : null}
      {error ? <p className="error">{error}</p> : null}

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
