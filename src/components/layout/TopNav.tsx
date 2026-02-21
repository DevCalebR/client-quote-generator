import { NavLink } from 'react-router-dom'

interface NavItem {
  end?: boolean
  label: string
  to: string
}

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/intake', label: 'Intake' },
  { to: '/quotes', label: 'Quotes' },
  { to: '/settings', label: 'Settings' },
] satisfies NavItem[]

export function TopNav() {
  return (
    <header className="top-nav">
      <div className="top-nav__brand">
        <p className="brand-eyebrow">Portfolio Project</p>
        <p className="brand-title">Client Intake + Quote Generator</p>
      </div>
      <nav aria-label="Primary navigation" className="top-nav__links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              `top-nav__link${isActive ? ' top-nav__link--active' : ''}`
            }
            end={item.end}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
