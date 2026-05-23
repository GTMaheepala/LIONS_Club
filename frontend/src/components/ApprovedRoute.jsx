import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Full member / admin dashboard area — redirects pending accounts to `/waiting`. */
export default function ApprovedRoute({ children }) {
  const { ready, token, user } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e8eef5",
          background: "#1a1a2e",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e8eef5",
          background: "#1a1a2e",
        }}
      >
        Restoring profile…
      </div>
    );
  }

  if (user.role !== "admin" && !user.hasFullAccess) {
    return (
      <Navigate
        to="/waiting"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
