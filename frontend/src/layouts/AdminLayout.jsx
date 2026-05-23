import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/adminDashboard.css";

function navClass({ isActive }) {
  return `lcms-sidebar-link${isActive ? " active" : ""}`;
}

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobile = () => setMobileMenuOpen(false);

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
          <div className="lcms-admin-brand-text">
            <strong>LCMS</strong>
            <small>Lions Club Membership · Admin office</small>
          </div>
        </div>
        <div className="lcms-admin-top-actions">
          <Link
            to="/dashboard"
            style={{ color: "#bfdbfe", fontWeight: 600, fontSize: "0.88rem" }}
          >
            Member view →
          </Link>
          <span>{user?.fullName}</span>
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
              <summary className="lcms-nav-group-summary">Membership</summary>
              <NavLink
                to="/admin/members/pending"
                className={navClass}
                onClick={closeMobile}
              >
                Pending approvals
              </NavLink>
              <NavLink
                to="/admin/members"
                className={navClass}
                onClick={closeMobile}
              >
                All members
              </NavLink>
            </details>

            <NavLink to="/admin/payments" className={navClass} onClick={closeMobile}>
              Payments & dues
            </NavLink>

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
                to="/admin/settings/users/add"
                className={navClass}
                onClick={closeMobile}
              >
                Users · Add user
              </NavLink>
            </details>
          </nav>

          <button type="button" className="lcms-sidebar-logout" onClick={logout}>
            Sign out
          </button>
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
