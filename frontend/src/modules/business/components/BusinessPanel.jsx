import { useCallback, useEffect, useState } from 'react'
import { businessApi } from '../../../shared/services/api/businessApi'

export function BusinessPanel({ token, permissions }) {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [actionItemId, setActionItemId] = useState(null)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [name, setName] = useState('')
  const [status, setStatus] = useState('active')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [editingBusinessId, setEditingBusinessId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editStatus, setEditStatus] = useState('active')
  const [editLatitude, setEditLatitude] = useState('')
  const [editLongitude, setEditLongitude] = useState('')

  const canRead = permissions.canRead
  const canWrite = permissions.canWrite
  const canDelete = permissions.canDelete
  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pageSize))

  const loadBusinesses = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await businessApi.list(token, {
        status: statusFilter === 'all' ? undefined : statusFilter,
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
  }, [token, statusFilter, pageSize, currentPage])

  useEffect(() => {
    if (!token || !canRead) {
      setItems([])
      setPagination({ total: 0, limit: pageSize, offset: 0 })
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
  }, [token, canRead, loadBusinesses, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, pageSize])

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

  const startEdit = (business) => {
    setEditingBusinessId(business.businessId)
    setEditName(String(business.name || ''))
    setEditStatus(String(business.status || 'active'))
    setEditLatitude(String(business.latitude ?? ''))
    setEditLongitude(String(business.longitude ?? ''))
    setError('')
  }

  const cancelEdit = () => {
    setEditingBusinessId(null)
    setEditName('')
    setEditStatus('active')
    setEditLatitude('')
    setEditLongitude('')
  }

  const handleUpdate = async (businessId) => {
    setActionItemId(businessId)
    setError('')

    try {
      await businessApi.update(token, businessId, {
        name: editName,
        status: editStatus,
        latitude: Number(editLatitude),
        longitude: Number(editLongitude),
      })

      cancelEdit()
      await loadBusinesses()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setActionItemId(null)
    }
  }

  const handleDelete = async (businessId) => {
    const shouldDelete = window.confirm('Delete this business?')
    if (!shouldDelete) {
      return
    }

    setActionItemId(businessId)
    setError('')

    try {
      await businessApi.remove(token, businessId)
      if (editingBusinessId === businessId) {
        cancelEdit()
      }
      await loadBusinesses()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setActionItemId(null)
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

      {token && canRead ? (
        <div className="form-inline">
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">all</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
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
            {editingBusinessId === business.businessId ? (
              <div className="form-inline">
                <input value={editName} onChange={(event) => setEditName(event.target.value)} />
                <input
                  value={editLatitude}
                  onChange={(event) => setEditLatitude(event.target.value)}
                />
                <input
                  value={editLongitude}
                  onChange={(event) => setEditLongitude(event.target.value)}
                />
                <select value={editStatus} onChange={(event) => setEditStatus(event.target.value)}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleUpdate(business.businessId)}
                  disabled={actionItemId === business.businessId}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={actionItemId === business.businessId}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <strong>{business.name}</strong>
                <span>{business.status}</span>
                {canWrite ? (
                  <button type="button" onClick={() => startEdit(business)}>
                    Edit
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(business.businessId)}
                    disabled={actionItemId === business.businessId}
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
