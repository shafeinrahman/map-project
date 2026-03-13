import { useEffect, useRef, useState } from 'react'
import { businessApi } from '../../../shared/services/api/businessApi'

const EMPTY_FORM = { name: '', addressText: '', latitude: '', longitude: '' }

export function DeliveryAddEntryModal({ token, isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM)
      setError('')
      setSubmitted(false)
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const lat = Number(form.latitude)
    const lng = Number(form.longitude)

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a number between -90 and 90.')
      return
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be a number between -180 and 180.')
      return
    }

    setIsSubmitting(true)

    try {
      await businessApi.create(token, {
        name: form.name.trim(),
        addressText: form.addressText.trim() || undefined,
        latitude: lat,
        longitude: lng,
        status: 'pending_review',
      })

      setSubmitted(true)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="delivery-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="delivery-modal">
        <div className="delivery-modal-header">
          <h3 id="delivery-modal-title">Suggest a new map entry</h3>
          <button
            type="button"
            className="delivery-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="delivery-modal-success">
            <span className="delivery-modal-success-icon">✓</span>
            <p>Your entry has been submitted for review.</p>
            <p className="delivery-modal-success-note">
              A super-admin will approve it before it appears on the map.
            </p>
            <button type="button" className="delivery-modal-btn" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form className="delivery-modal-form" onSubmit={handleSubmit} noValidate>
            <p className="delivery-modal-notice">
              This entry will be sent for super-admin approval before appearing on the map.
            </p>

            <label className="delivery-modal-label">
              Name <span aria-hidden="true">*</span>
              <input
                ref={nameRef}
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Nakumatt Oasis"
                required
                autoComplete="off"
              />
            </label>

            <label className="delivery-modal-label">
              Address
              <input
                type="text"
                value={form.addressText}
                onChange={set('addressText')}
                placeholder="e.g. 25 Lumumba Ave, Kampala"
                autoComplete="off"
              />
            </label>

            <div className="delivery-modal-coords">
              <label className="delivery-modal-label">
                Latitude <span aria-hidden="true">*</span>
                <input
                  type="number"
                  value={form.latitude}
                  onChange={set('latitude')}
                  placeholder="e.g. 0.3136"
                  step="any"
                  required
                />
              </label>
              <label className="delivery-modal-label">
                Longitude <span aria-hidden="true">*</span>
                <input
                  type="number"
                  value={form.longitude}
                  onChange={set('longitude')}
                  placeholder="e.g. 32.5811"
                  step="any"
                  required
                />
              </label>
            </div>

            {error && <p className="delivery-modal-error">{error}</p>}

            <div className="delivery-modal-actions">
              <button type="button" className="delivery-modal-btn delivery-modal-btn--secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="delivery-modal-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit for review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
