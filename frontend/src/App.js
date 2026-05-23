import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ApprovedRoute from "./components/ApprovedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminPendingMembers from "./pages/admin/AdminPendingMembers";
import AdminAllMembers from "./pages/admin/AdminAllMembers";
import AdminAddUser from "./pages/admin/AdminAddUser";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import { getPostAuthRedirect } from "./utils/access";

function HomeRedirect() {
  const { ready, isAuthenticated, user } = useAuth();
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
  if (isAuthenticated) {
    return <Navigate to={getPostAuthRedirect(user)} replace />;
  }
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route
        path="/waiting"
        element={
          <ProtectedRoute>
            <WaitingRoomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ApprovedRoute>
            <DashboardPage />
          </ApprovedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="members/pending" element={<AdminPendingMembers />} />
        <Route path="members" element={<AdminAllMembers />} />
        <Route path="settings/users/add" element={<AdminAddUser />} />
        <Route
          path="payments"
          element={
            <AdminPlaceholder
              title="Payments & foundation history"
              description="Proposal §6.3 · import read-only dues / voluntary gifts from legacy spreadsheets into member dashboards."
              backTo="/admin"
            />
          }
        />
        <Route
          path="reports/district"
          element={
            <AdminPlaceholder
              title="District reporting"
              description="Proposal §6.5.2 · active counts per district, drill-down roster, CSV export — implementation queued."
              backTo="/admin"
            />
          }
        />
        <Route
          path="reports/awards"
          element={
            <AdminPlaceholder
              title="Year-end club & district awards"
              description="Proposal §6.5.3 · track new memberships ranked by club and district."
              backTo="/admin"
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
