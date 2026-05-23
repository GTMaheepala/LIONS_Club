import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiJson } from "../../utils/api";
import "../../styles/adminDashboard.css";

export default function AdminAddUser() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isAdministrator, setIsAdministrator] = useState(false);
  const [grantFullAccess, setGrantFullAccess] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");
    if (password !== confirm) {
      setError("Passwords must match.");
      return;
    }
    if (password.length < 8) {
      setError("Password needs at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiJson("/api/auth/admin/users", {
        method: "POST",
        token,
        body: {
          firstName,
          lastName,
          email: email.trim().toLowerCase(),
          password,
          isAdministrator,
          grantFullAccess: isAdministrator ? true : grantFullAccess,
        },
      });
      setOk(res.message || "User created.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setTimeout(() => navigate("/admin/members"), 1200);
    } catch (err) {
      setError(err.message || "Unable to save user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lcms-admin-card">
      <div className="lcms-page-header-row">
        <div>
          <Link to="/admin/members" className="lcms-back-link">
            ← BACK
          </Link>
          <h1 className="lcms-page-title" style={{ marginTop: "0.65rem" }}>
            Add new user
          </h1>
          <p className="lcms-muted" style={{ margin: 0 }}>
            Proposal administrator tools §5.2 / §6.5 — issue accounts with the right posture for
            your district.
          </p>
        </div>
      </div>

      {error && <div className="lcms-alert lcms-alert-err">{error}</div>}
      {ok && <div className="lcms-alert lcms-alert-ok">{ok}</div>}

      <form onSubmit={onSubmit}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem", color: "#0f172a" }}>
          General information
        </h2>
        <div className="lcms-form-row-2">
          <div className="lcms-form-field">
            <label htmlFor="ad-first">First name</label>
            <input
              id="ad-first"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="lcms-form-field">
            <label htmlFor="ad-last">Last name</label>
            <input
              id="ad-last"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="lcms-form-field" style={{ marginBottom: "0.25rem", marginTop: "0.5rem" }}>
          <label htmlFor="ad-mail">Email</label>
          <input
            id="ad-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="lcms-form-field" style={{ marginTop: "1rem" }}>
          <label htmlFor="ad-pw">Password</label>
          <input
            id="ad-pw"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="lcms-form-field">
          <label htmlFor="ad-pwc">Confirm password</label>
          <input
            id="ad-pwc"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <h3 className="lcms-form-section-title">Roles & access</h3>

        <div className="lcms-role-row">
          <div className="lcms-role-meta">
            <strong>Administrator</strong>
            <span>Lions foundation back-office parity — approvals, dues entry, districts.</span>
          </div>
          <label className="lcms-toggle">
            <input
              type="checkbox"
              checked={isAdministrator}
              onChange={(e) => setIsAdministrator(e.target.checked)}
            />
            <span className="lcms-toggle-ui" aria-hidden />
          </label>
        </div>

        <div className="lcms-role-row" style={{ opacity: isAdministrator ? 0.5 : 1 }}>
          <div className="lcms-role-meta">
            <strong>Grant full Lions portal access immediately</strong>
            <span>
              Off by default: new Lions appear under <strong>Pending approvals</strong>. Turn this on
              only if they should skip the queue and log in as fully approved straight away.
            </span>
          </div>
          <label className="lcms-toggle">
            <input
              type="checkbox"
              checked={grantFullAccess}
              disabled={isAdministrator}
              onChange={(e) => setGrantFullAccess(e.target.checked)}
            />
            <span className="lcms-toggle-ui" aria-hidden />
          </label>
        </div>

        <div style={{ marginTop: "1.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="submit" className="lcms-primary-btn" disabled={submitting}>
            ADD USER
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "0.55rem 1rem",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
