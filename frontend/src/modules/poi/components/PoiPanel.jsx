import { useCallback, useEffect, useState } from 'react'
import { poiApi } from '../../../shared/services/api/poiApi'

export function PoiPanel({ token, permissions }) {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [actionItemId, setActionItemId] = useState(null)
  const [error, setError] = useState('')
  const [poiTypeFilter, setPoiTypeFilter] = useState('all')
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [poiName, setPoiName] = useState('')
  const [poiType, setPoiType] = useState('general')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [editingPoiId, setEditingPoiId] = useState(null)
  const [editPoiName, setEditPoiName] = useState('')
  const [editPoiType, setEditPoiType] = useState('general')
  const [editLatitude, setEditLatitude] = useState('')
  const [editLongitude, setEditLongitude] = useState('')

  const canRead = permissions.canRead
  const canWrite = permissions.canWrite
  const canDelete = permissions.canDelete
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pageSize))

  const loadPois = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await poiApi.list(token, {
        poiType: poiTypeFilter === 'all' ? undefined : poiTypeFilter,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      })
      setItems(response.items || [])
      setPagination(response.pagination || { total: 0, limit: pageSize, offset: 0 })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [token, poiTypeFilter, pageSize, currentPage])

  useEffect(() => {
    if (!token || !canRead) {
      setItems([])
      setPagination({ total: 0, limit: pageSize, offset: 0 })
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
  }, [token, canRead, loadPois, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [poiTypeFilter, pageSize])

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

  const startEdit = (poi) => {
    setEditingPoiId(poi.poiId)
    setEditPoiName(String(poi.poiName || ''))
    setEditPoiType(String(poi.poiType || 'general'))
    setEditLatitude(String(poi.latitude ?? ''))
    setEditLongitude(String(poi.longitude ?? ''))
    setError('')
  }

  const cancelEdit = () => {
    setEditingPoiId(null)
    setEditPoiName('')
    setEditPoiType('general')
    setEditLatitude('')
    setEditLongitude('')
  }

  const handleUpdate = async (poiId) => {
    setActionItemId(poiId)
    setError('')

    try {
      await poiApi.update(token, poiId, {
        poiName: editPoiName,
        poiType: editPoiType,
        latitude: Number(editLatitude),
        longitude: Number(editLongitude),
      })

      cancelEdit()
      await loadPois()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setActionItemId(null)
    }
  }

  const handleDelete = async (poiId) => {
    const shouldDelete = window.confirm('Delete this POI?')
    if (!shouldDelete) {
      return
    }

    setActionItemId(poiId)
    setError('')

    try {
      await poiApi.remove(token, poiId)
      if (editingPoiId === poiId) {
        cancelEdit()
      }
      await loadPois()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setActionItemId(null)
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

      {token && canRead ? (
        <div className="form-inline">
          <label>
            POI type
            <select value={poiTypeFilter} onChange={(event) => setPoiTypeFilter(event.target.value)}>
              <option value="all">all</option>
              <option value="general">general</option>
              <option value="shop">shop</option>
              <option value="warehouse">warehouse</option>
            </select>
          </label>
          <label>
            Page size
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      ) : null}

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
            {editingPoiId === poi.poiId ? (
              <div className="form-inline">
                <input
                  value={editPoiName}
                  onChange={(event) => setEditPoiName(event.target.value)}
                />
                <input
                  value={editPoiType}
                  onChange={(event) => setEditPoiType(event.target.value)}
                />
                <input
                  value={editLatitude}
                  onChange={(event) => setEditLatitude(event.target.value)}
                />
                <input
                  value={editLongitude}
                  onChange={(event) => setEditLongitude(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleUpdate(poi.poiId)}
                  disabled={actionItemId === poi.poiId}
                >
                  Save
                </button>
                <button type="button" onClick={cancelEdit} disabled={actionItemId === poi.poiId}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <strong>{poi.poiName}</strong>
                <span>{poi.poiType}</span>
                {canWrite ? (
                  <button type="button" onClick={() => startEdit(poi)}>
                    Edit
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(poi.poiId)}
                    disabled={actionItemId === poi.poiId}
                  >
                    Delete
                  </button>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>

      {token && canRead ? (
        <div className="row-between">
          <p>
            Page {currentPage} of {totalPages} · {pagination.total || 0} total
          </p>
          <div className="actions-row">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={isLoading || currentPage <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={isLoading || currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
