import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/useAuthContext.js'
import { LoginSuccessAnimation } from '../components/LoginSuccessAnimation.jsx'

export function LoginPage() {
  const auth = useAuthContext()
  const navigate = useNavigate()
  const [email, setEmail] = useState('super-admin@internal-maps.local')
  const [password, setPassword] = useState('change-me-admin')
  const [showAnimation, setShowAnimation] = useState(false)

  // Redirect if already authenticated and not showing animation
  useEffect(() => {
    if (auth.isAuthenticated && !showAnimation) {
      navigate('/')
    }
  }, [auth.isAuthenticated, showAnimation, navigate])

  // Navigate after animation completes
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        navigate('/')
      }, 3500) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [showAnimation, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await auth.login({ email, password })
      // Trigger animation on successful login
      setShowAnimation(true)
    } catch {
      // Error state is already managed inside auth hook.
    }
  }

  return (
    <main className="auth-page">
      <LoginSuccessAnimation isAnimating={showAnimation} />

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

          <button type="submit" disabled={auth.isLoading || showAnimation}>
            {auth.isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          {auth.error && <p className="error">{auth.error}</p>}
        </form>
      </section>
    </main>
  )
}

export default LoginPage