import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiJson } from "../../utils/api";
import "../../styles/adminDashboard.css";

export default function AdminOverview() {
  const { token } = useAuth();
  const [pending, setPending] = useState(0);
  const [members, setMembers] = useState(0);
  const [admins, setAdmins] = useState(0);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const [pData, allData] = await Promise.all([
        apiJson("/api/auth/admin/pending-members", { token }),
        apiJson("/api/auth/admin/members", { token }),
      ]);
      const p = Array.isArray(pData.users) ? pData.users.length : 0;
      const all = Array.isArray(allData.users) ? allData.users : [];
      setPending(p);
      setMembers(all.filter((u) => u.role === "member").length);
      setAdmins(all.filter((u) => u.role === "admin").length);
    } catch (e) {
      setPending(0);
      setMembers(0);
      setAdmins(0);
      setLoadError(e.message || "Could not refresh dashboard counts.");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="lcms-page-title">Administrator dashboard</h1>
      <p className="lcms-muted" style={{ marginTop: "-0.15rem", maxWidth: 680 }}>
        LCMS aligns with foundation goals: approve self-registered Lions, oversee members,
        districts, dues display, and year-end recognition (see project proposal phases 2–4).
      </p>
      <p className="lcms-muted" style={{ marginBottom: "1rem", maxWidth: 680, fontSize: "0.88rem" }}>
        <strong>Pending approvals</strong> counts only non-admin accounts still on{" "}
        <em>pending</em> status (public sign-ups, or <strong>Add user</strong> when “Grant full Lions
        portal access immediately” is turned <strong>off</strong>). If you created someone with immediate
        access enabled, they are already approved — use <strong>All members</strong> to see them.
      </p>

      {loadError ? (
        <div className="lcms-alert lcms-alert-err" style={{ maxWidth: 680 }}>
          {loadError}
        </div>
      ) : null}

      <div className="lcms-stat-grid">
        <div className="lcms-stat-tile">
          <span>Pending approvals</span>
          <strong>{pending}</strong>
          <Link
            className="lcms-muted"
            style={{ fontSize: "0.8rem", marginTop: "0.5rem", display: "inline-block" }}
            to="/admin/members/pending"
          >
            Review queue →
          </Link>
        </div>
        <div className="lcms-stat-tile">
          <span>Lions members</span>
          <strong>{members}</strong>
        </div>
        <div className="lcms-stat-tile">
          <span>Administrators</span>
          <strong>{admins}</strong>
        </div>
      </div>

      <section className="lcms-admin-card">
        <h2 style={{ margin: "0 0 0.65rem", fontSize: "1.05rem" }}>Quick actions</h2>
        <ul className="lcms-muted" style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.7 }}>
          <li>
            <Link to="/admin/settings/users/add">Add a foundation user manually</Link> —
            onboarding without public sign-up when needed.
          </li>
          <li>
            <Link to="/admin/members/pending">Clear the verification backlog</Link> —
            unlocking full portal access per proposal §6.2–6.5.
          </li>
        </ul>
      </section>
    </div>
  );
}
