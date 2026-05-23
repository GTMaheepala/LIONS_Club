import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthBackgroundSlides from "../components/AuthBackgroundSlides";
import "../styles/auth.css";

const sampleSections = [
  {
    title: "Sample dashboard",
    desc: "Personalised welcome and club summary appear here once you are approved.",
  },
  {
    title: "Sample payment history",
    desc: "Read-only foundation payment records (Club & Extra contributions) preview.",
  },
  {
    title: "Sample verification",
    desc: "Membership number + PIN verification unlocks Verified Member badges after approval.",
  },
];

/** Limited “sample” UI for pending members — not the live system yet. */
export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const { logout, user, token, ready } = useAuth();

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

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.hasFullAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #4a3728 0%, #2d2418 55%)",
        color: "#f5ebe0",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          background: "rgba(0,0,0,0.25)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span style={{ fontWeight: 800, letterSpacing: 0.03 }}>LCMS · Preview</span>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ opacity: 0.85, fontSize: "0.85rem" }}>{user.email}</span>
          <button
            type="button"
            onClick={logout}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: 8,
              border: "none",
              background: "#f5ebe0",
              color: "#2d2418",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main style={{ padding: "2rem 1.25rem", maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderRadius: 12,
            background: "rgba(180,140,70,0.25)",
            border: "1px solid rgba(255,220,170,0.35)",
            marginBottom: "1.75rem",
          }}
        >
          <strong>Account pending approval</strong>
          <p style={{ margin: "0.65rem 0 0", lineHeight: 1.55, opacity: 0.95 }}>
            Hello, <strong>{user.fullName}</strong>. An administrator must approve your
            registration before you can use the live system (dashboards, verification, and payment
            history). Below is preview-only placeholder content similar to what you will see once
            approved.
          </p>
        </div>

        <h2 style={{ fontSize: "1.05rem", marginBottom: "1rem", opacity: 0.92 }}>
          Preview pages (read-only demos)
        </h2>

        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {sampleSections.map((s) => (
            <li
              key={s.title}
              style={{
                padding: "1.1rem 1.25rem",
                borderRadius: 10,
                background: "rgba(0,0,0,0.2)",
                marginBottom: "0.85rem",
                borderLeft: "4px solid #c9a227",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{s.title}</div>
              <div style={{ opacity: 0.88, fontSize: "0.92rem" }}>{s.desc}</div>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: "2rem", fontSize: "0.9rem", opacity: 0.8 }}>
          Refresh after an admin approves you, or{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              margin: "0",
              padding: 0,
              border: "none",
              background: "none",
              color: "#fde68a",
              fontWeight: 700,
              textDecoration: "underline",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "inherit",
            }}
          >
            sign in again
          </button>{" "}
          to reload your access.
        </p>
      </main>
    </div>
  );
}
