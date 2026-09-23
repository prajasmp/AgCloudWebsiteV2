import React, { useState, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  Menu, X, LogOut, ShieldCheck, UserPlus,
  Server, Loader2, ChevronDown, Headphones, FileText,
  RefreshCcw, PackageCheck
} from 'lucide-react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef(null);

  const { user, loginWithGoogle, logout, isAdmin, authLoading } = useAuth();
  const { currency, toggleCurrency } = useCurrency();

  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const adminDropdownTimeoutRef = useRef(null);

  const handleMouseEnterSupport = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setSupportDropdownOpen(true);
  };

  const handleMouseLeaveSupport = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setSupportDropdownOpen(false);
    }, 220);
  };

  const handleMouseEnterAdmin = () => {
    if (adminDropdownTimeoutRef.current) clearTimeout(adminDropdownTimeoutRef.current);
    setAdminDropdownOpen(true);
  };

  const handleMouseLeaveAdmin = () => {
    adminDropdownTimeoutRef.current = setTimeout(() => {
      setAdminDropdownOpen(false);
    }, 220);
  };

  const defaultAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'AG')}&background=00c8ff&color=020711&bold=true`;

  return (
    <header className="nav-wrap-design6">
      <nav className="nav container design6-nav">

        <Link className="brand-design6" to="/">
          <img src="/assets/agcloud-logo.png" alt="AG Cloud Logo" className="brand-logo-design6" />
          <div className="brand-text-block">
            <span className="brand-title">AG CLOUD</span>
            <span className="brand-subtitle">Limitless Possibilities</span>
          </div>
        </Link>

        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`nav-links-design6 ${mobileOpen ? 'open' : ''}`}>
          <NavLink to="/" onClick={() => setMobileOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
            Home
          </NavLink>

          <NavLink to="/plans" onClick={() => setMobileOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
            Plans
          </NavLink>

          <div
            className="nav-dropdown-wrapper"
            onMouseEnter={handleMouseEnterSupport}
            onMouseLeave={handleMouseLeaveSupport}
          >
            <button
              className="nav-dropdown-btn"
              onClick={() => setSupportDropdownOpen(!supportDropdownOpen)}
            >
              <span>Support</span>
              <ChevronDown size={14} className={`dropdown-arrow ${supportDropdownOpen ? 'open' : ''}`} />
            </button>

            {supportDropdownOpen && (
              <div className="support-menu-dropdown">
                <Link to="/contact" onClick={() => { setSupportDropdownOpen(false); setMobileOpen(false); }}>
                  <Headphones size={16} className="menu-icon cyan" />
                  <div>
                    <span className="menu-title">Contact Us</span>
                    <span className="menu-desc">24/7 specialized human support</span>
                  </div>
                </Link>

                <Link to="/terms" onClick={() => { setSupportDropdownOpen(false); setMobileOpen(false); }}>
                  <FileText size={16} className="menu-icon cyan" />
                  <div>
                    <span className="menu-title">Terms of Service</span>
                    <span className="menu-desc">Rules, SLA & hosting terms</span>
                  </div>
                </Link>

                <Link to="/refund-policy" onClick={() => { setSupportDropdownOpen(false); setMobileOpen(false); }}>
                  <RefreshCcw size={16} className="menu-icon cyan" />
                  <div>
                    <span className="menu-title">Refund Policy</span>
                    <span className="menu-desc">Guarantees & refund process</span>
                  </div>
                </Link>

                <Link to="/track-order" onClick={() => { setSupportDropdownOpen(false); setMobileOpen(false); }}>
                  <PackageCheck size={16} className="menu-icon cyan" />
                  <div>
                    <span className="menu-title">Track Order</span>
                    <span className="menu-desc">Lookup payment status by Order ID</span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {user && (
            <>
              <NavLink to="/dashboard" onClick={() => setMobileOpen(false)}>
                Dashboard
              </NavLink>
              <NavLink to="/panel" onClick={() => setMobileOpen(false)} className="highlight-panel-link">
                <Server size={14} style={{ display: 'inline', marginRight: '4px' }} /> My Servers
              </NavLink>
            </>
          )}

          {isAdmin && (
            <div
              className="nav-dropdown-wrapper"
              onMouseEnter={handleMouseEnterAdmin}
              onMouseLeave={handleMouseLeaveAdmin}
            >
              <button
                className="nav-dropdown-btn admin-dropdown-btn"
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
              >
                <ShieldCheck size={15} className="admin-btn-icon" />
                <span>Admin</span>
                <ChevronDown size={14} className={`dropdown-arrow ${adminDropdownOpen ? 'open' : ''}`} />
              </button>

              {adminDropdownOpen && (
                <div className="support-menu-dropdown admin-menu-dropdown">
                  <Link to="/admin" onClick={() => { setAdminDropdownOpen(false); setMobileOpen(false); }}>
                    <ShieldCheck size={16} className="menu-icon cyan" />
                    <div>
                      <span className="menu-title">Admin Console</span>
                      <span className="menu-desc">Review & manage submitted orders</span>
                    </div>
                  </Link>

                  <Link to="/admin-emails" onClick={() => { setAdminDropdownOpen(false); setMobileOpen(false); }}>
                    <UserPlus size={16} className="menu-icon green" style={{ color: '#34d399' }} />
                    <div>
                      <span className="menu-title" style={{ color: '#34d399' }}>Admin Emails</span>
                      <span className="menu-desc">Add & delete admin access emails</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="auth-box-design6">

          <button
            className="currency-toggle-design6"
            onClick={toggleCurrency}
            title="Switch Currency (INR / USD)"
          >
            {currency === 'INR' ? (
              <>
                <span>INR ₹</span>
                <ChevronDown size={13} />
              </>
            ) : (
              <>
                <span>USD $</span>
                <ChevronDown size={13} />
              </>
            )}
          </button>

          {user ? (
            <div className="user-profile-design6">
              <img
                className="avatar"
                src={user.photoURL || defaultAvatar(user.displayName)}
                alt={user.displayName}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.src = defaultAvatar(user.displayName);
                }}
              />
              <span className="user-name-short">{user.displayName?.split(' ')[0]}</span>
              <button className="ghost-btn logout-btn" onClick={logout} title="Sign Out">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              className="login-btn-design6"
              onClick={loginWithGoogle}
              disabled={authLoading}
            >
              {authLoading ? <Loader2 size={15} className="spin-icon" /> : 'Login'}
            </button>
          )}

          <Link to="/plans" className="get-started-btn-design6">
            Get Started →
          </Link>
        </div>
      </nav>

      <div className="neon-line-container">
        <svg className="neon-line-svg" viewBox="0 0 1200 12" preserveAspectRatio="none">
          <filter id="neonGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <path
            d="M 0 2 H 160 L 180 10 H 1020 L 1040 2 H 1200"
            fill="none"
            stroke="#00C8FF"
            strokeWidth="2.5"
            filter="url(#neonGlowFilter)"
          />
        </svg>
      </div>
    </header>
  );
}
