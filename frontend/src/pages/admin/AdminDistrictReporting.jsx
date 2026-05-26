import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiJson } from "../../utils/api";
import "../../styles/yearEndAwards.css";

function csvEscape(cell) {
  const s = cell == null ? "" : String(cell);
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function PodiumDistrictTile({ variant, headline, districtName, rowCount }) {
  if (!districtName) return null;
  return (
    <div className={`lcms-awards-slot lcms-awards-slot--${variant}`}>
      <div className="lcms-awards-slot-rank">{headline}</div>
      <div className="lcms-awards-slot-name">{districtName}</div>
      <span className="lcms-awards-slot-count">{rowCount}</span>
      <span className="lcms-awards-slot-count-sub">ledger rows</span>
    </div>
  );
}

export default function AdminDistrictReporting() {
  const { token } = useAuth();

  const [ledgerTotal, setLedgerTotal] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [countRes, distRes] = await Promise.all([
        apiJson("/api/contributions/count", { token }),
        apiJson("/api/contributions/stats/districts?limit=100", { token }),
      ]);
      const t = countRes?.total;
      setLedgerTotal(typeof t === "number" && Number.isFinite(t) ? t : null);
      setDistricts(Array.isArray(distRes?.districts) ? distRes.districts : []);
    } catch (e) {
      setLedgerTotal(null);
      setDistricts([]);
      setError(e.message || "Could not load district reporting.");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const attributedRows = useMemo(
    () => districts.reduce((s, d) => s + (Number(d.rowCount) || 0), 0),
    [districts],
  );

  const top3 = useMemo(() => {
    const a = districts[0];
    const b = districts[1];
    const c = districts[2];
    return { gold: a, silver: b, bronze: c };
  }, [districts]);

  const remainderNoDistrict =
    ledgerTotal != null ? Math.max(0, ledgerTotal - attributedRows) : null;

  function exportSummaryCsv() {
    const rows = [["Rank", "District", "Ledger rows"]];
    districts.forEach((d, idx) => {
      rows.push([String(idx + 1), String(d.district ?? ""), String(d.rowCount ?? "")]);
    });
    const csv = `${rows.map((r) => r.map(csvEscape).join(",")).join("\r\n")}\r\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `lcms-district-summary-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="lcms-admin-card lcms-awards">
      <div className="lcms-awards-inner">
        <Link to="/admin" className="lcms-back-link">
          ← BACK
        </Link>

        <header className="lcms-awards-head">
          <div className="lcms-awards-badge">Contributor ledger · Proposal 6.5.2 pilot</div>
          <h1 className="lcms-awards-title">District reporting · summary</h1>
          <p className="lcms-awards-sub">
            Counts mirror the foundation ledger: each row with a District value is grouped below (same methodology
            as <strong>Year-end awards · district signal</strong>). Open a district&apos;s roster in{" "}
            <strong>All members</strong> filters, or export this summary as CSV — full roster CSV remains on the
            ledger screen.
          </p>
        </header>

        {error ? <div className="lcms-awards-err">{error}</div> : null}

        <div className="lcms-awards-metrics" role="region" aria-label="District report summary">
          <div className="lcms-awards-metric">
            <div className="lcms-awards-metric-label">All ledger rows</div>
            <div className="lcms-awards-metric-value">{ledgerTotal === null ? "—" : ledgerTotal}</div>
            <span className="lcms-awards-metric-note">Includes rows with no district</span>
          </div>
          <div className="lcms-awards-metric">
            <div className="lcms-awards-metric-label">Districts listed</div>
            <div className="lcms-awards-metric-value">{districts.length}</div>
            <span className="lcms-awards-metric-note">Distinct non-empty district labels</span>
          </div>
          <div className="lcms-awards-metric">
            <div className="lcms-awards-metric-label">Rows with district</div>
            <div className="lcms-awards-metric-value">{attributedRows}</div>
            <span className="lcms-awards-metric-note">
              {remainderNoDistrict != null
                ? `${remainderNoDistrict.toLocaleString()} row(s) had blank district · drill down via ledger filters`
                : "Matches sum of counts in the table"}
            </span>
          </div>
        </div>

        <section aria-labelledby="lcms-district-podium-heading">
          <h2 id="lcms-district-podium-heading" className="visually-hidden">
            Top three districts by ledger rows
          </h2>
          <div className="lcms-awards-podium-row" aria-label="District podium by ledger rows">
            <PodiumDistrictTile
              variant="silver"
              headline="#2 · Runner-up volume"
              districtName={top3.silver?.district}
              rowCount={top3.silver?.rowCount}
            />
            <PodiumDistrictTile
              variant="gold"
              headline="#1 · Leading district"
              districtName={top3.gold?.district}
              rowCount={top3.gold?.rowCount}
            />
            <PodiumDistrictTile
              variant="bronze"
              headline="#3 · Strong activity"
              districtName={top3.bronze?.district}
              rowCount={top3.bronze?.rowCount}
            />
          </div>
          {!districts.length && !error ? (
            <p className="lcms-awards-empty">
              No district labels yet — add District on{" "}
              <Link to="/admin/payments" className="lcms-back-link" style={{ display: "inline" }}>
                Foundation contributors & dues
              </Link>
              .
            </p>
          ) : null}
        </section>

        <section className="lcms-awards-panel" aria-labelledby="lcms-district-table-heading">
          <div className="lcms-awards-panel-head">
            <h2 id="lcms-district-table-heading" className="lcms-awards-panel-title">
              Full district rollup
            </h2>
            <p className="lcms-awards-panel-note">
              Sorted by ledger rows descending · up to 100 districts · use Roster for a filtered contributor view.
            </p>
          </div>
          <div className="lcms-awards-table-wrap">
            {districts.length ? (
              <table className="lcms-awards-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>District</th>
                    <th>Ledger rows</th>
                    <th>Roster</th>
                  </tr>
                </thead>
                <tbody>
                  {districts.map((d, idx) => (
                    <tr key={`${d.district}:${idx}`}>
                      <td className="lcms-awards-table-rank">{idx + 1}</td>
                      <td>{d.district}</td>
                      <td>{d.rowCount}</td>
                      <td>
                        <Link
                          className="lcms-district-roster-link"
                          to={`/admin/payments?district=${encodeURIComponent(d.district ?? "")}`}
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="lcms-awards-empty">{error ? "—" : "No district data"}</p>
            )}
          </div>
        </section>

        <div className="lcms-awards-actions">
          <button type="button" className="lcms-awards-link" onClick={exportSummaryCsv} disabled={!districts.length}>
            Download summary CSV
          </button>
          <Link to="/admin/reports/awards" className="lcms-awards-link">
            Year-end awards (clubs + districts) →
          </Link>
          <Link to="/admin/payments" className="lcms-awards-link">
            Open contributor ledger · full export →
          </Link>
          <Link to="/admin" className="lcms-awards-link">
            ← Administrator dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
