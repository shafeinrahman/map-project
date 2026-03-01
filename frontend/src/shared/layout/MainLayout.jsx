export function MainLayout({ children }) {
  return (
    <div className="layout-root">
      <header className="topbar">
        <div>
          <h1>Internal Maps Platform</h1>
          <p>React modular frontend for map workflows</p>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  )
}
