import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiBase } from "../utils/api";
import { getPostAuthRedirect } from "../utils/access";
import "../styles/auth.css";

export default function RegisterPage() {
  const { register, ready, isAuthenticated, user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const configured = Boolean(getApiBase());

  if (!ready) {
    return (
      <div className="auth-layout">
        <p className="auth-brand">Loading…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getPostAuthRedirect(user)} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!configured) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register(fullName.trim(), email.trim(), password);
    } catch (err) {
      setError(err.message || "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <h1>LCMS</h1>
        <p>Create your member account</p>
      </div>
      <div className="auth-card">
        <h2>Sign up</h2>
        <p style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "-0.5rem" }}>
          New registrations stay on preview-only pages until an administrator approves you.
        </p>
        {!configured && (
          <div className="auth-alert" role="alert">
            Set <code>REACT_APP_API_URL</code> for this production build to your API
            origin — no trailing slash.
          </div>
        )}
        {error && (
          <div className="auth-alert" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              At least 8 characters (same rule as API).
            </span>
          </div>
          <div className="auth-field">
            <label htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button
            className="auth-submit"
            type="submit"
            disabled={submitting || !configured}
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
