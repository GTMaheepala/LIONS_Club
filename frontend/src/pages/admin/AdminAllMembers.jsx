import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiJson } from "../../utils/api";
import "../../styles/adminDashboard.css";

export default function AdminAllMembers() {
  const { token } = useAuth();
  const [filter, setFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="lcms-admin-card" style={{ maxWidth: "100%" }}>
      <div className="lcms-page-header-row">
        <div>
          <Link to="/admin" className="lcms-back-link">
            ← BACK
          </Link>
          <h1 className="lcms-page-title">All members</h1>
          <p className="lcms-muted" style={{ margin: 0 }}>
            Proposal §6.5.1 · central list · search & district filters arrive in a future step.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label className="lcms-muted" style={{ marginRight: "0.5rem", fontSize: "0.85rem" }}>
          Filter:
        </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Everyone</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="admins">Administrators</option>
        </select>
      </div>

      {error && <div className="lcms-alert lcms-alert-err">{error}</div>}

      {loading ? (
        <p className="lcms-muted">Loading…</p>
      ) : (
        <div className="lcms-table-wrap">
          <table className="lcms-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
