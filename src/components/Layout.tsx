import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { setSearchTerm } from '../store/coinsSlice';
import Hero from './Hero';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

/**
 * App shell: navbar (with mobile menu), hero, main content, footer.
 * Search and nav links collapse into a vertical menu on small screens.
 */
const Layout: FC<LayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const searchTerm = useAppSelector((state) => state.coins.searchTerm);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app">
      <header
        className={`navbar ${mobileMenuOpen ? 'navbar--mobile-open' : ''}`}
        role="banner"
      >
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            Cryptonite
          </Link>
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav className="navbar-links" aria-label="Main navigation">
            <NavLink to="/" end className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/reports" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Real-Time Reports
            </NavLink>
            <NavLink to="/ai" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              AI Recommendation
            </NavLink>
            <NavLink to="/about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              About
            </NavLink>
          </nav>
        </div>
        <div className="navbar-right">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search coins..."
              value={searchTerm}
              onChange={(event) => dispatch(setSearchTerm(event.target.value))}
              aria-label="Search coins by name or symbol"
            />
          </div>
        </div>
      </header>

      <Hero />

      <main className="main-content">{children}</main>

      <Footer />
    </div>
  );
};

export default Layout;

