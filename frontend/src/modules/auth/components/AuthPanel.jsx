import { useState } from 'react'

export function AuthPanel({ auth }) {
  const [email, setEmail] = useState('admin@internal-maps.local')
  const [password, setPassword] = useState('change-me-admin')

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await auth.login({ email, password })
    } catch {
      // Error state is already managed inside useAuth hook.
    }
  }

  return (
    <section className="card">
      <h2>Authentication</h2>

      {!auth.isAuthenticated ? (
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button type="submit" disabled={auth.isLoading}>
            {auth.isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          {auth.error && <p className="error">{auth.error}</p>}
        </form>
      ) : (
        <div className="stack-sm">
          <p>
            Signed in as <strong>{auth.user.email}</strong>
          </p>
          <p>
            Role: <strong>{auth.user.role}</strong>
          </p>
          <button type="button" onClick={auth.logout}>
            Logout
          </button>
        </div>
      )}
    </section>
  )
}
