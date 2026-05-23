import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiBase } from "../utils/api";
import { getPostAuthRedirect } from "../utils/access";
import AuthBackgroundSlides from "../components/AuthBackgroundSlides";
import "../styles/auth.css";

export default function LoginPage() {
  const { login, ready, isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const configured = Boolean(getApiBase());
  const redirectTarget = location.state?.from?.pathname || "/dashboard";

  if (!ready) {
    return (
      <div className="auth-layout">
        <AuthBackgroundSlides />
        <div className="auth-stack">
          <p className="auth-brand">Loading…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={getPostAuthRedirect(user, redirectTarget)}
        replace
      />
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!configured) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <AuthBackgroundSlides />
      <div className="auth-stack">
        <div className="auth-brand">
          <h1>LCMS</h1>
          <p>Lions Club Membership System</p>
        </div>
        <div className="auth-card">
        <h2>Sign in</h2>
        {!configured && (
          <div className="auth-alert" role="alert">
            Set <code>REACT_APP_API_URL</code> for this production build (e.g. in Vercel
            env) to your API origin — no trailing slash.
          </div>
        )}
        {error && (
          <div className="auth-alert" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            className="auth-submit"
            type="submit"
            disabled={submitting || !configured}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="auth-footer">
          No account? <Link to="/signup">Sign up</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
