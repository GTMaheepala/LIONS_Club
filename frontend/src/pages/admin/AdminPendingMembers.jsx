import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiJson } from "../../utils/api";
import "../../styles/adminDashboard.css";

export default function AdminPendingMembers() {
  const { token, loadProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [note, setNote] = useState("");

  const fetchPending = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiJson("/api/auth/admin/pending-members", { token });
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e) {
      setError(e.message || "Failed to load pending members.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchPending();
  }, [token, fetchPending]);

  async function approve(id) {
    setBusyId(id);
    setNote("");
    try {
      const res = await apiJson(`/api/auth/admin/members/${id}/approve`, {
        method: "PATCH",
        token,
      });
      setNote(res.message || "Member approved.");
      await fetchPending();
      await loadProfile();
    } catch (e) {
      setError(e.message || "Approval failed.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="lcms-admin-card">
      <div className="lcms-page-header-row">
        <div>
          <Link to="/admin/members" className="lcms-back-link">
            ← BACK
          </Link>
          <h1 className="lcms-page-title">Pending memberships</h1>
          <p className="lcms-muted" style={{ margin: 0, maxWidth: 640 }}>
            Proposal §6.2: Lions who self-register remain on preview routes until verified here.
          </p>
        </div>
      </div>

      {note && <div className="lcms-alert lcms-alert-ok">{note}</div>}
      {error && <div className="lcms-alert lcms-alert-err">{error}</div>}

      {loading ? (
        <p className="lcms-muted">Loading…</p>
      ) : users.length === 0 ? (
        <p>No members waiting.</p>
      ) : (
        <div className="lcms-table-wrap">
          <table className="lcms-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Requested</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((m) => (
                <tr key={m.id}>
                  <td>{m.fullName}</td>
                  <td>{m.email}</td>
                  <td>
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      className="lcms-btn-approve"
                      onClick={() => approve(m.id)}
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
