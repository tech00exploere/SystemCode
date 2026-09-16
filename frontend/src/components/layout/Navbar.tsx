// src/components/layout/Navbar.tsx
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const LINKS = [
  { to: '/',        label: 'Problems' },
  { to: '/history', label: 'My Attempts' },
];

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">⚙</span>
          <span className="navbar__logo-text">
            LLD <span>Practice</span>
          </span>
        </Link>

        <div className="navbar__links">
          {LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`navbar__link ${pathname === to ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="navbar__badge">
          CipherSchools · SEP 2026
        </div>
      </div>
    </nav>
  );
}
