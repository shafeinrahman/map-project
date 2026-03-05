import { useState } from 'react'
import { useAuthContext } from '../context/useAuthContext.js'

export function ProfilePage() {
  const auth = useAuthContext()
  const [draftDisplayName, setDraftDisplayName] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextDisplayName = draftDisplayName.trim() || auth.user?.displayName || ''
    auth.updateProfile({ displayName: nextDisplayName })
    setDraftDisplayName('')
    setSaved(true)
  }

  return (
    <section className="card profile-card">
      <h2>Profile</h2>
      <p className="muted">Update how your account appears in the dashboard.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Display name
          <input
            value={draftDisplayName || auth.user?.displayName || ''}
            onChange={(event) => {
              setDraftDisplayName(event.target.value)
              setSaved(false)
            }}
            placeholder="Enter display name"
          />
        </label>

        <label>
          Email
          <input value={auth.user?.email || ''} disabled />
        </label>

        <label>
          Role
          <input value={auth.user?.role || ''} disabled />
        </label>

        <button type="submit">Save profile</button>

        {saved ? <p className="muted">Profile updated.</p> : null}
      </form>
    </section>
  )
}

export default ProfilePage