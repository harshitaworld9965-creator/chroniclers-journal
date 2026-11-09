import { NavLink } from 'react-router-dom'

function Icon({ children, size = 26 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export default function BottomNav({ onAdd }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <NavLink to="/" end className="bottom-nav__link" aria-label="Home">
        <Icon>
          <path d="M4 11 12 4l8 7" />
          <path d="M6 10v10h4v-6h4v6h4V10" />
        </Icon>
      </NavLink>

      <NavLink to="/journal" className="bottom-nav__link" aria-label="Journal">
        <Icon>
          <path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5z" />
          <path d="M12 6v14" />
        </Icon>
      </NavLink>

      <button className="wax-seal" onClick={onAdd} aria-label="Quick add">
        <Icon size={30}>
          <path d="M12 5v14M5 12h14" />
        </Icon>
      </button>

      <NavLink to="/stats" className="bottom-nav__link" aria-label="Heatmaps">
        <Icon>
          <path d="M5 20v-8M9.5 20V6M14 20v-9M18.5 20V9" />
        </Icon>
      </NavLink>

      <NavLink to="/night" className="bottom-nav__link" aria-label="Nightfall">
        <Icon>
          <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />
        </Icon>
      </NavLink>
    </nav>
  )
}