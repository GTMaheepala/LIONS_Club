import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Full-access member dashboard (requires admin approval or admin role). */
export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0f3460 0%, #1a1a2e 45%)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          padding: "1rem 1.5rem",
          background: "rgba(0,0,0,0.2)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Link
          to="/dashboard"
          style={{ color: "#e8eef5", textDecoration: "none", fontWeight: 700 }}
        >
          LCMS
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {user?.role === "admin" ? (
            <Link
              to="/admin"
              style={{
                color: "#a7f3d0",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Admin approvals
            </Link>
          ) : null}
          <button
            type="button"
            onClick={logout}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: 8,
              border: "none",
              background: "#e8eef5",
              color: "#0f3460",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main style={{ padding: "2rem 1.25rem", maxWidth: 640, margin: "0 auto" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "1.75rem",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          }}
        >
          <h1 style={{ margin: "0 0 0.75rem", color: "#1a1a2e" }}>
            Welcome, {user?.fullName || "member"}
          </h1>
          <p style={{ margin: "0 0 1rem", color: "#4b5563" }}>
            Signed in as <strong>{user?.email}</strong>
            {user?.role ? (
              <>
                {" "}
                · Role: <strong>{user.role}</strong>
              </>
            ) : null}
          </p>
          {user?.role === "member" && (
            <p
              style={{
                margin: "0 0 1rem",
                fontSize: "0.875rem",
                color: "#166534",
                background: "#ecfdf5",
                padding: "0.6rem 0.85rem",
                borderRadius: 8,
                border: "1px solid #bbf7d0",
              }}
            >
              Account status: approved — foundation tools and dashboards can be wired here next
              (verification, payments view, districts, etc.).
            </p>
          )}
          {user?.role === "admin" && (
            <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#374151" }}>
              You have administrator access. Open{" "}
              <Link to="/admin" style={{ fontWeight: 600 }}>
                pending approvals
              </Link>{" "}
              to activate new registrations.
            </p>
          )}
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
            Pending users only see preview pages until an admin approves their account.
          </p>
        </div>
      </main>
    </div>
  );
}
