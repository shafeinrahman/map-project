import { Link } from 'react-router-dom'
import { SidebarNav } from './SidebarNav.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export function MainLayout({ auth, children, fullBleed = false }) {
  const isDelivery = auth.user?.role === 'delivery'
  const { theme, toggle } = useTheme()

  return (
    <div className="layout-root">
      <header className="topbar">
        <div className="topbar-brand">
          <h1>Pathfinder</h1>
          <p>Map Platform</p>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>

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
        </div>
      </header>

      <div className="app-body">
        {auth.isAuthenticated && !isDelivery ? (
          <SidebarNav role={auth.user?.role} />
        ) : null}
        <main className={`content${fullBleed ? ' content--full-bleed' : ''}`}>{children}</main>
      </div>
    </div>
  )
}
