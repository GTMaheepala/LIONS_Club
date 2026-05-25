import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiJson } from "../../utils/api";
import "../../styles/adminDashboard.css";

function IconStatPending() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconStatLedger() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" x2="16" y1="13" y2="13" />
      <line x1="8" x2="16" y1="17" y2="17" />
    </svg>
  );
}

function IconStatAdmin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconStatTopClub() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconActionUserPlus() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" x2="20" y1="8" y2="14" />
      <line x1="23" x2="17" y1="11" y2="11" />
    </svg>
  );
}

function IconActionInbox() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function IconActionLedger() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
      <line x1="7" x2="7" y1="8" y2="8.01" />
      <line x1="17" x2="11" y1="12" y2="12" />
      <line x1="17" x2="11" y1="16" y2="16" />
      <line x1="7" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function IconActionMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" x2="8" y1="2" y2="18" />
      <line x1="16" x2="16" y1="6" y2="22" />
    </svg>
  );
}

function IconActionAward() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 19 17 23 15.79 13.87" />
    </svg>
  );
}

export default function AdminOverview() {
  const { token } = useAuth();
  const [pending, setPending] = useState(0);
  const [ledgerRows, setLedgerRows] = useState(0);
  const [admins, setAdmins] = useState(0);
  const [topClubName, setTopClubName] = useState("");
  const [topClubRows, setTopClubRows] = useState(0);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const [pData, allData, ledgerCountRes, topClubRes] = await Promise.all([
        apiJson("/api/auth/admin/pending-members", { token }),
        apiJson("/api/auth/admin/members", { token }),
        apiJson("/api/contributions/count", { token }),
        apiJson("/api/contributions/stats/top-club", { token }),
      ]);
      const p = Array.isArray(pData.users) ? pData.users.length : 0;
      const all = Array.isArray(allData.users) ? allData.users : [];
      setPending(p);
      const lc = ledgerCountRes?.total;
      setLedgerRows(typeof lc === "number" && Number.isFinite(lc) ? lc : 0);
      setAdmins(all.filter((u) => u.role === "admin").length);
      const name = typeof topClubRes?.clubName === "string" ? topClubRes.clubName.trim() : "";
      const rc = topClubRes?.rowCount;
      setTopClubName(name);
      setTopClubRows(typeof rc === "number" && Number.isFinite(rc) ? rc : 0);
    } catch (e) {
      setPending(0);
      setLedgerRows(0);
      setAdmins(0);
      setTopClubName("");
      setTopClubRows(0);
      setLoadError(e.message || "Could not refresh dashboard counts.");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="lcms-dash">
      <header className="lcms-dash-hero">
        <h1 className="lcms-dash-title">Administrator dashboard</h1>
        <p className="lcms-dash-lead">
          Operate memberships, approvals, and the contributor ledger — with reporting modules evolving in
          line with phases 2–4 of the LCMS proposal.
        </p>

        <details className="lcms-dash-details">
          <summary className="lcms-dash-details-summary">
            How these numbers are counted
          </summary>
          <div className="lcms-dash-details-body">
            <p>
              <strong>Pending approvals</strong> includes non-admin accounts still on{" "}
              <em>pending</em> (public sign-up, or <strong>Add user</strong> without immediate full access).
              With immediate access on, accounts skip this queue — see <strong>Users</strong>.
            </p>
            <p>
              <strong>Lions members</strong> on this dashboard is the total rows in the{" "}
              <strong>All members</strong> contributor ledger (foundation gifts / dues spreadsheet), not
              portal user count.
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>Largest club</strong> is the club column value with the highest number of ledger
              rows (same as counting rows on the contributors table — duplicates each count once); rows
              without a club are excluded.
            </p>
          </div>
        </details>
      </header>

      {loadError ? (
        <div className="lcms-alert lcms-alert-err" style={{ marginBottom: "1rem", maxWidth: 720 }}>
          {loadError}
        </div>
      ) : null}

      <div className="lcms-dash-stats" role="region" aria-label="Key totals">
        <article className="lcms-dash-stat lcms-dash-stat--pending">
          <div className="lcms-dash-stat-top">
            <span className="lcms-dash-stat-icon-wrap" aria-hidden>
              <IconStatPending />
            </span>
            <span className="lcms-dash-stat-label">Pending approvals</span>
          </div>
          <strong className="lcms-dash-stat-value">{pending}</strong>
          <Link className="lcms-dash-stat-link" to="/admin/members/pending">
            Open queue
          </Link>
        </article>

        <article className="lcms-dash-stat lcms-dash-stat--ledger">
          <div className="lcms-dash-stat-top">
            <span className="lcms-dash-stat-icon-wrap" aria-hidden>
              <IconStatLedger />
            </span>
            <span className="lcms-dash-stat-label">Lions members (ledger rows)</span>
          </div>
          <strong className="lcms-dash-stat-value">{ledgerRows}</strong>
          <Link className="lcms-dash-stat-link" to="/admin/payments">
            View contributor ledger
          </Link>
        </article>

        <article className="lcms-dash-stat lcms-dash-stat--topclub">
          <div className="lcms-dash-stat-top">
            <span className="lcms-dash-stat-icon-wrap" aria-hidden>
              <IconStatTopClub />
            </span>
            <span className="lcms-dash-stat-label">Largest club (ledger rows)</span>
          </div>
          <strong className="lcms-dash-stat-value">{topClubRows}</strong>
          {topClubName ? (
            <span className="lcms-dash-stat-muted lcms-dash-stat-clubname" title={topClubName}>
              {topClubName}
            </span>
          ) : (
            <span className="lcms-dash-stat-muted">No club attributed in ledger yet</span>
          )}
        </article>

        <article className="lcms-dash-stat lcms-dash-stat--admin">
          <div className="lcms-dash-stat-top">
            <span className="lcms-dash-stat-icon-wrap" aria-hidden>
              <IconStatAdmin />
            </span>
            <span className="lcms-dash-stat-label">Administrators</span>
          </div>
          <strong className="lcms-dash-stat-value">{admins}</strong>
          <span className="lcms-dash-stat-muted">Back-office Operator accounts</span>
        </article>
      </div>

      <section className="lcms-dash-panel" aria-labelledby="lcms-dash-actions-heading">
        <div className="lcms-dash-panel-head">
          <h2 id="lcms-dash-actions-heading" className="lcms-dash-panel-title">
            Quick actions
          </h2>
          <span className="lcms-dash-panel-hint">One click into common tasks · more flows land here over time.</span>
        </div>

        <div className="lcms-dash-action-grid">
          <Link className="lcms-dash-action" to="/admin/settings/users/add">
            <span className="lcms-dash-action-arrow" aria-hidden>
              →
            </span>
            <span className="lcms-dash-action-icon" aria-hidden>
              <IconActionUserPlus />
            </span>
            <span className="lcms-dash-action-title">Add foundation user</span>
            <span className="lcms-dash-action-desc">Manual onboarding — no public sign-up required.</span>
          </Link>

          <Link className="lcms-dash-action" to="/admin/members/pending">
            <span className="lcms-dash-action-arrow" aria-hidden>
              →
            </span>
            <span className="lcms-dash-action-icon" aria-hidden>
              <IconActionInbox />
            </span>
            <span className="lcms-dash-action-title">Approval queue</span>
            <span className="lcms-dash-action-desc">Verify registrations per proposal §6.2–6.5.</span>
          </Link>

          <Link className="lcms-dash-action" to="/admin/payments">
            <span className="lcms-dash-action-arrow" aria-hidden>
              →
            </span>
            <span className="lcms-dash-action-icon" aria-hidden>
              <IconActionLedger />
            </span>
            <span className="lcms-dash-action-title">Contributor ledger</span>
            <span className="lcms-dash-action-desc">Foundation gifts · CSV template & import §6.3.</span>
          </Link>

          <Link className="lcms-dash-action" to="/admin/reports/district">
            <span className="lcms-dash-action-arrow" aria-hidden>
              →
            </span>
            <span className="lcms-dash-action-icon" aria-hidden>
              <IconActionMap />
            </span>
            <span className="lcms-dash-action-title">District reporting</span>
            <span className="lcms-dash-action-desc">Proposal 6.5.2 — ledger rollup, roster links, CSV summary.</span>
          </Link>

          <Link className="lcms-dash-action" to="/admin/reports/awards">
            <span className="lcms-dash-action-arrow" aria-hidden>
              →
            </span>
            <span className="lcms-dash-action-icon" aria-hidden>
              <IconActionAward />
            </span>
            <span className="lcms-dash-action-title">Year-end awards</span>
            <span className="lcms-dash-action-desc">§6.5.3 leaderboard preview — tied to contributor ledger row counts.</span>
          </Link>
        </div>
      </section>

      <p className="lcms-dash-footnote">
        <strong>Coming up:</strong> deeper district filters, richer dues dashboards, audit trails — wire new
        cards here as endpoints ship without crowding operators today.
      </p>
    </div>
  );
}
