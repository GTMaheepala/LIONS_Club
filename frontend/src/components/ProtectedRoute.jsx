import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
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
        Loading session…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  /* Token stored but profile not restored yet — wait for bootstrap /me result */
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

  return children;
}
