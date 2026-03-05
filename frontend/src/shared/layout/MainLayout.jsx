import { Link } from 'react-router-dom'

export function MainLayout({ auth, children }) {
  return (
    <div className="layout-root">
      <header className="topbar">
        <div className="topbar-brand">
          <h1>Internal Maps Platform</h1>
          <p>React modular frontend for map workflows</p>
        </div>

        {auth?.isAuthenticated ? (
          <details className="user-menu">
            <summary>
              {auth.user?.displayName || auth.user?.email}
              <span className="muted">{auth.user?.role}</span>
            </summary>

            <div className="user-menu-content">
              <Link to="/profile">Change profile</Link>
              <button type="button" onClick={auth.logout}>
                Log out
              </button>
            </div>
          </details>
        ) : null}
      </header>
      <main className="content">{children}</main>
    </div>
  )
}
