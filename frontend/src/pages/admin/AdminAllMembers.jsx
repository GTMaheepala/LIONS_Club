import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiJson } from "../../utils/api";
import "../../styles/adminDashboard.css";

function IconPlus() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconProtected() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/** @typedef {{ id: string; fullName: string; email: string; role: string; approvalStatus?: string; isSuperAdministrator?: boolean }} RowUser */

/**
 * Modal form state matched to PATCH / PUT /admin/members/:id
 * @typedef {{ id: string; fullName: string; email: string; role: string; approvalStatus: string; password: string }} DraftUser
 */

export default function AdminAllMembers() {
  const { token, user: currentUser, loadProfile } = useAuth();
  const [filter, setFilter] = useState("all");
  /** @type {RowUser[]} */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  /** @type {DraftUser | null} */
  const [draft, setDraft] = useState(null);
  const [modalError, setModalError] = useState("");
  const [modalBusy, setModalBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs =
        filter === "pending"
          ? "?status=pending"
          : filter === "approved"
            ? "?status=approved"
            : filter === "admins"
              ? "?status=admin"
              : "";
      const data = await apiJson(`/api/auth/admin/members${qs}`, { token });
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e) {
      setError(e.message || "Failed to load.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!draft) return undefined;
    function onKey(e) {
      if (e.key === "Escape") setDraft(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [draft]);

  /** @param {RowUser} u */
  function openEdit(u) {
    if (u.isSuperAdministrator) return;
    setModalError("");
    setDraft({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      approvalStatus: u.approvalStatus || "pending",
      password: "",
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!draft) return;
    setModalError("");
    setModalBusy(true);
    try {
      /** @type {Record<string, unknown>} */
      const body = {
        fullName: draft.fullName.trim(),
        email: draft.email.trim().toLowerCase(),
        role: draft.role,
      };
      if (draft.role === "member") {
        body.approvalStatus = draft.approvalStatus;
      }
      if (draft.password.trim()) {
        body.password = draft.password.trim();
      }

      const res = await apiJson(`/api/auth/admin/members/${encodeURIComponent(String(draft.id).trim())}`, {
        method: "PUT",
        token,
        body,
      });

      if (res.user && currentUser && res.user.id === currentUser.id) {
        await loadProfile();
      }
      setDraft(null);
      await load();
    } catch (err) {
      setModalError(err.message || "Update failed.");
    } finally {
      setModalBusy(false);
    }
  }

  /** @param {RowUser} u */
  async function removeUser(u) {
    if (u.isSuperAdministrator) return;
    if (currentUser && u.id === currentUser.id) return;
    const ok = window.confirm(
      `Delete user ${u.fullName} (${u.email})? This cannot be undone.`
    );
    if (!ok) return;
    setError("");
    try {
      await apiJson(`/api/auth/admin/members/${encodeURIComponent(String(u.id).trim())}`, { method: "DELETE", token });
      await load();
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  }

  const isSelf = (id) => currentUser && id === currentUser.id;

  const emptyMessage =
    filter === "pending"
      ? "No pending members match this filter right now."
      : filter === "approved"
        ? "No approved members match this filter right now."
        : filter === "admins"
          ? "No administrator accounts match this filter."
          : "Nobody is registered yet.";

  return (
    <div className="lcms-users-page">
      <div className="lcms-admin-card">
        <Link to="/admin" className="lcms-back-link lcms-users-back">
          ← BACK
        </Link>

        <header className="lcms-users-hero">
          <h1 className="lcms-users-title">Users</h1>
          <p className="lcms-users-lead">
            Manage portal operators and Lions members — add new accounts from here or steer people through
            public sign-up and pending approvals.
          </p>
          <details className="lcms-users-details">
            <summary>Proposal §6.5.1 notes</summary>
            <p className="lcms-users-details-body">
              This list is the central roster for the Phase-1 administrator console; search fields and district
              filters plug in alongside later reporting modules — same row model, richer filters ahead.
            </p>
          </details>
        </header>

        <div className="lcms-users-toolbar">
          <div className="lcms-users-toolbar-left">
            <div className="lcms-users-filter-stack">
              <span className="lcms-users-filter-label" id="users-filter-label">
                Show roster
              </span>
              <select
                className="lcms-users-select"
                aria-labelledby="users-filter-label"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Everyone</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved Members</option>
                <option value="admins">Administrators</option>
              </select>
            </div>
            {!loading ? (
              <p className="lcms-users-count">
                Showing <strong>{users.length}</strong> {users.length === 1 ? "person" : "people"}
              </p>
            ) : (
              <p className="lcms-users-count" aria-hidden>
                ···
              </p>
            )}
          </div>
          <Link
            to="/admin/settings/users/add"
            className="lcms-btn-add-entry lcms-btn-with-icon"
          >
            <IconPlus />
            Add user
          </Link>
        </div>

        {error && <div className="lcms-alert lcms-alert-err">{error}</div>}

        {loading ? (
          <div className="lcms-users-loading" aria-busy="true" aria-live="polite">
            <div className="lcms-users-loading-bar" />
            Loading roster…
          </div>
        ) : users.length === 0 ? (
          <div className="lcms-users-empty">
            <p className="lcms-users-empty-title">No rows to display</p>
            <p className="lcms-users-empty-caption">{emptyMessage}</p>
          </div>
        ) : (
          <div className="lcms-table-wrap">
            <table className="lcms-table lcms-table-users">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Access</th>
                  <th scope="col" style={{ width: "1%", whiteSpace: "nowrap" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="lcms-users-cell-name">{u.fullName}</td>
                    <td>
                      <span className="lcms-users-cell-email" title={u.email}>
                        {u.email}
                      </span>
                    </td>
                    <td>
                      {u.isSuperAdministrator ? (
                        <span className="lcms-chip lcms-chip-super">Super admin</span>
                      ) : (
                        <span
                          className={`lcms-chip${u.role === "admin" ? " lcms-chip-admin" : ""}`}
                          style={
                            u.role === "member"
                              ? { background: "#f1f5f9", color: "#334155" }
                              : undefined
                          }
                        >
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td>
                      {u.role === "admin" ? (
                        <span className="lcms-chip lcms-chip-approved">full office</span>
                      ) : u.approvalStatus === "pending" ? (
                        <span className="lcms-chip lcms-chip-pending">preview</span>
                      ) : (
                        <span className="lcms-chip lcms-chip-approved">approved</span>
                      )}
                    </td>
                    <td>
                      {u.isSuperAdministrator ? (
                        <span
                          className="lcms-users-protected"
                          title="Managed via SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD on the server."
                        >
                          <IconProtected />
                          Env only
                        </span>
                      ) : (
                        <div className="lcms-table-actions">
                          <button
                            type="button"
                            className="lcms-btn-ghost"
                            onClick={() => openEdit(u)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="lcms-btn-danger"
                            disabled={isSelf(u.id)}
                            title={
                              isSelf(u.id)
                                ? "You cannot delete the account you are signed in with."
                                : undefined
                            }
                            onClick={() => removeUser(u)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {draft ? (
        <div
          className="lcms-modal-backdrop"
          role="presentation"
          onClick={() => !modalBusy && setDraft(null)}
        >
          <div
            className="lcms-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lcms-user-edit-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 id="lcms-user-edit-title" className="lcms-modal-title">
              Edit user
            </h2>
            <p className="lcms-modal-sub">Update identity, portal access, or set a new password.</p>

            {modalError ? <div className="lcms-alert lcms-alert-err">{modalError}</div> : null}

            <form onSubmit={saveEdit}>
              <div className="lcms-form-field">
                <label htmlFor="um-name">Full name</label>
                <input
                  id="um-name"
                  value={draft.fullName}
                  onChange={(e) => setDraft((d) => (d ? { ...d, fullName: e.target.value } : d))}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="lcms-form-field">
                <label htmlFor="um-email">Email</label>
                <input
                  id="um-email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => (d ? { ...d, email: e.target.value } : d))}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="lcms-form-field">
                <label htmlFor="um-role">Role</label>
                <select
                  id="um-role"
                  value={draft.role}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            role: e.target.value,
                            approvalStatus:
                              e.target.value === "admin" ? "approved" : d.approvalStatus,
                          }
                        : d
                    )
                  }
                >
                  <option value="member">Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {draft.role === "member" ? (
                <div className="lcms-form-field">
                  <label htmlFor="um-access">Portal access</label>
                  <select
                    id="um-access"
                    value={draft.approvalStatus}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, approvalStatus: e.target.value } : d))
                    }
                  >
                    <option value="pending">Pending (preview)</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              ) : null}

              <div className="lcms-form-field">
                <label htmlFor="um-pw">New password (optional)</label>
                <input
                  id="um-pw"
                  type="password"
                  autoComplete="new-password"
                  value={draft.password}
                  placeholder="Leave blank to keep current"
                  onChange={(e) => setDraft((d) => (d ? { ...d, password: e.target.value } : d))}
                  minLength={draft.password.trim() ? 8 : undefined}
                />
              </div>

              <div className="lcms-modal-actions">
                <button
                  type="button"
                  className="lcms-btn-ghost"
                  disabled={modalBusy}
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="lcms-primary-btn" disabled={modalBusy}>
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
