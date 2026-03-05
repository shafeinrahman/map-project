import { useState } from 'react'
import { useAuthContext } from '../context/useAuthContext.js'

export function LoginPage() {
  const auth = useAuthContext()
  const [email, setEmail] = useState('admin@internal-maps.local')
  const [password, setPassword] = useState('change-me-admin')

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await auth.login({ email, password })
    } catch {
      // Error state is already managed inside auth hook.
    }
  }

  return (
    <main className="auth-page">
      <section className="card auth-card">
        <h2>Sign in</h2>
        <p className="muted">Use your Internal Maps account to access the dashboard.</p>

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
      </section>
    </main>
  )
}

export default LoginPage