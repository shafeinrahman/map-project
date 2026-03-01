import { useEffect, useState } from 'react'
import { businessApi } from '../../../shared/services/api/businessApi'

export function BusinessPanel({ token, canRead }) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !canRead) {
      setItems([])
      return
    }

    let cancelled = false

    const loadBusinesses = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await businessApi.list(token)
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

    loadBusinesses()

    return () => {
      cancelled = true
    }
  }, [token, canRead])

  return (
    <section className="card">
      <h2>Businesses</h2>
      {!token ? <p>Login required.</p> : null}
      {token && !canRead ? <p>Your role cannot read businesses.</p> : null}
      {isLoading ? <p>Loading businesses...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <ul className="list">
        {items.map((business) => (
          <li key={business.businessId}>
            <strong>{business.name}</strong>
            <span>{business.status}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
