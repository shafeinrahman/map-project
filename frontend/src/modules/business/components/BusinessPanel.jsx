import { useEffect, useState } from 'react'
import { businessApi } from '../../../shared/services/api/businessApi'

export function BusinessPanel({ token, permissions }) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState('active')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  const canRead = permissions.canRead
  const canWrite = permissions.canWrite

  const loadBusinesses = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await businessApi.list(token)
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

    loadBusinesses().catch(() => {
      if (!cancelled) {
        setError('Failed to load businesses.')
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
      await businessApi.create(token, {
        name,
        status,
        latitude: Number(latitude),
        longitude: Number(longitude),
      })

      setName('')
      setStatus('active')
      setLatitude('')
      setLongitude('')
      await loadBusinesses()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="card">
      <div className="row-between">
        <h2>Businesses</h2>
        <button type="button" onClick={loadBusinesses} disabled={!token || !canRead || isLoading}>
          Refresh
        </button>
      </div>

      {!token ? <p>Login required.</p> : null}
      {token && !canRead ? <p>Your role cannot read businesses.</p> : null}
      {isLoading ? <p>Loading businesses...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {token && canWrite ? (
        <form className="form-inline" onSubmit={handleCreate}>
          <input
            placeholder="Business name"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button type="submit" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </form>
      ) : null}

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
