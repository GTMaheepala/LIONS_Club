import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/adminDashboard.css";

function navClass({ isActive }) {
  return `lcms-sidebar-link${isActive ? " active" : ""}`;
}

function initialsFromName(name) {
  if (!name || !String(name).trim()) return "?";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function IconMemberView() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg className="lcms-admin-user-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountWrapRef = useRef(null);

  const closeMobile = () => setMobileMenuOpen(false);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    function onPointerDown(e) {
      if (accountWrapRef.current && !accountWrapRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setAccountMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountMenuOpen]);

  return (
    <div className="lcms-admin-root">
      <header className="lcms-admin-topbar">
        <div className="lcms-admin-brand">
          <button
            type="button"
            className="lcms-admin-menu-trigger lcms-hide-desktop-menu"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            <span aria-hidden>☰</span>
          </button>
          <div className="lcms-admin-brand-mark" aria-hidden>
            LC
          </div>
          <div className="lcms-admin-brand-text">
            <span className="lcms-admin-brand-lockup">
              <strong id="lcms-admin-app-label">LCMS</strong>
              <span className="lcms-admin-top-env">Console</span>
            </span>
            <small id="lcms-admin-app-desc">Lions Club Membership · Admin office</small>
          </div>
        </div>
        <div className="lcms-admin-top-actions">
          <Link to="/dashboard" className="lcms-topbar-link" onClick={closeMobile}>
            <IconMemberView />
            <span>Member view</span>
          </Link>

          <span className="lcms-admin-top-rule" aria-hidden />

          <div className="lcms-admin-account" ref={accountWrapRef}>
            <button
              type="button"
              className="lcms-admin-account-trigger"
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              aria-controls="lcms-admin-account-menu"
              id="lcms-admin-account-open"
              onClick={() => setAccountMenuOpen((o) => !o)}
            >
              <span className="lcms-admin-avatar" aria-hidden title={user?.fullName || "Account"}>
                {initialsFromName(user?.fullName)}
              </span>
              <span className="lcms-admin-account-text">
                <span className="lcms-admin-account-name">{user?.fullName || "Admin"}</span>
                <span className="lcms-admin-account-sub">
                  {user?.isSuperAdministrator ? "Super administrator" : "Administrator"}
                  {user?.email ? ` · ${user.email}` : ""}
                </span>
              </span>
              <ChevronDown />
            </button>

            {accountMenuOpen ? (
              <div
                className="lcms-admin-dropdown"
                id="lcms-admin-account-menu"
                role="menu"
                aria-labelledby="lcms-admin-account-open"
              >
                <div className="lcms-admin-dropdown-meta">
                  <div className="lcms-admin-dropdown-label">Signed in as</div>
                  <div className="lcms-admin-dropdown-strong">{user?.fullName}</div>
                  {user?.email ? <div className="lcms-admin-dropdown-email">{user.email}</div> : null}
                </div>
                <div className="lcms-admin-dropdown-rule" />
                <Link role="menuitem" className="lcms-dropdown-item" to="/dashboard" onClick={() => setAccountMenuOpen(false)}>
                  <IconMemberView />
                  Open member portal
                </Link>
                <NavLink role="menuitem" className="lcms-dropdown-item" to="/admin/settings/users/add" onClick={() => setAccountMenuOpen(false)}>
                  Quick: Add user
                </NavLink>
                {/* Future: Notifications, Org settings */}
                <div className="lcms-admin-dropdown-rule" />
                <button role="menuitem" type="button" className="lcms-dropdown-item lcms-dropdown-item-danger" onClick={() => { setAccountMenuOpen(false); logout(); }}>
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="lcms-admin-shell">
        {mobileMenuOpen && (
          <button
            type="button"
            className="lcms-admin-sidebar-overlay"
            aria-label="Close menu"
            onClick={closeMobile}
          />
        )}

        <aside
          className={`lcms-admin-sidebar${
            !mobileMenuOpen ? " mobile-hidden" : ""
          }`}
        >
          <div className="lcms-admin-org">
            <div className="lcms-admin-org-mark">LL</div>
            <div className="lcms-admin-org-meta">
              <strong>Lanka Lions Foundation</strong>
              <span>District Sri Lanka · Back office</span>
            </div>
          </div>

          <nav className="lcms-admin-nav">
            <NavLink to="/admin" end className={navClass} onClick={closeMobile}>
              Dashboard
            </NavLink>

            <details className="lcms-nav-group" open>
              <summary className="lcms-nav-group-summary">Members</summary>
              <NavLink to="/admin/payments" className={navClass} onClick={closeMobile}>
                All members
              </NavLink>
            </details>

            <details className="lcms-nav-group" open>
              <summary className="lcms-nav-group-summary">Reporting</summary>
              <NavLink
                to="/admin/reports/district"
                className={navClass}
                onClick={closeMobile}
              >
                District reports
              </NavLink>
              <NavLink
                to="/admin/reports/awards"
                className={navClass}
                onClick={closeMobile}
              >
                Year-end awards
              </NavLink>
            </details>

            <details className="lcms-nav-group" open>
              <summary className="lcms-nav-group-summary">Settings</summary>
              <NavLink
                to="/admin/members/pending"
                className={navClass}
                onClick={closeMobile}
              >
                Pending approvals
              </NavLink>
              <NavLink to="/admin/members" end className={navClass} onClick={closeMobile}>
                Users
              </NavLink>
              <NavLink
                to="/admin/settings/users/add"
                className={navClass}
                onClick={closeMobile}
              >
                Users · Add user
              </NavLink>
            </details>
          </nav>

          <div className="lcms-sidebar-footer">
            <button type="button" className="lcms-sidebar-logout" onClick={logout}>
              <span className="lcms-sidebar-logout-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              Sign out
            </button>
          </div>
        </aside>

        <div className="lcms-admin-main">
          <div className="lcms-admin-content">
            <Outlet />
          </div>
          <footer className="lcms-admin-footer-note">
            LCMS Administrator Console — proposal-aligned modules shipping incrementally ·{" "}
            {new Date().getFullYear()}
          </footer>
        </div>
      </div>

      <style>{`
        @media (min-width: 992px) {
          .lcms-hide-desktop-menu {
            display: none !important;
          }
          .lcms-admin-sidebar.mobile-hidden {
            display: flex !important;
          }
        }
      `}</style>

      <button
        type="button"
        className="lcms-help-fab"
        title="Help (placeholder)"
        aria-label="Help"
      >
        ?
      </button>
    </div>
  );
}
