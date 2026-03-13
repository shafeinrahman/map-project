import { NavLink } from 'react-router-dom'

const roleNav = {
  'super-admin': [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/inbox', label: 'Inbox' },
    { to: '/map', label: 'Map' },
    { to: '/database', label: 'Database' },
  ],
  'business-admin': [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/map', label: 'Map' },
    { to: '/database', label: 'Database' },
  ],
}

export function SidebarNav({ role }) {
  const items = roleNav[role] || [{ to: '/', label: 'Dashboard', end: true }]

  return (
    <nav className="sidebar-nav" aria-label="Main navigation">
      {items.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `sidebar-nav__item${isActive ? ' sidebar-nav__item--active' : ''}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
