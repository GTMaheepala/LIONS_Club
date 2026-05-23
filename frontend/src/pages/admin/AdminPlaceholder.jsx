import { Link } from "react-router-dom";
import "../../styles/adminDashboard.css";

export default function AdminPlaceholder({
  title,
  description,
  backTo = "/admin",
}) {
  return (
    <div className="lcms-admin-card">
      <Link to={backTo} className="lcms-back-link">
        ← BACK
      </Link>
      <h1 className="lcms-page-title">{title}</h1>
      <p style={{ margin: 0 }}>{description}</p>
    </div>
  );
}
