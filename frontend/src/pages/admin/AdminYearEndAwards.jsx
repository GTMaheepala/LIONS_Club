import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiJson } from "../../utils/api";
import "../../styles/yearEndAwards.css";

function PodiumTile({ variant, headline, clubName, rowCount }) {
  if (!clubName) return null;
  return (
    <div className={`lcms-awards-slot lcms-awards-slot--${variant}`}>
      <div className="lcms-awards-slot-rank">{headline}</div>
      <div className="lcms-awards-slot-name">{clubName}</div>
      <span className="lcms-awards-slot-count">{rowCount}</span>
      <span className="lcms-awards-slot-count-sub">ledger rows</span>
    </div>
  );
}

export default function AdminYearEndAwards() {
  const { token } = useAuth();
  const awardYear = new Date().getFullYear();

  const [ledgerTotal, setLedgerTotal] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [countRes, clubRes, distRes] = await Promise.all([
        apiJson("/api/contributions/count", { token }),
        apiJson("/api/contributions/stats/clubs?limit=200", { token }),
        apiJson("/api/contributions/stats/districts?limit=100", { token }),
      ]);
      const t = countRes?.total;
      setLedgerTotal(typeof t === "number" && Number.isFinite(t) ? t : null);
      setClubs(Array.isArray(clubRes?.clubs) ? clubRes.clubs : []);
      setDistricts(Array.isArray(distRes?.districts) ? distRes.districts : []);
    } catch (e) {
      setLedgerTotal(null);
      setClubs([]);
      setDistricts([]);
      setError(e.message || "Could not load year-end leaderboard.");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const top3 = useMemo(() => {
    const a = clubs[0];
    const b = clubs[1];
    const c = clubs[2];
    return { gold: a, silver: b, bronze: c };
  }, [clubs]);

  const ledgerWithClub = useMemo(() => clubs.reduce((s, x) => s + (x.rowCount || 0), 0), [clubs]);

  return (
    <div className="lcms-admin-card lcms-awards">
      <div className="lcms-awards-inner">
        <Link to="/admin" className="lcms-back-link">
          ← BACK
        </Link>

        <header className="lcms-awards-head">
          <div className="lcms-awards-badge">
            Ledger-linked preview · Proposal §6.5.3 direction
          </div>
          <h1 className="lcms-awards-title">Year-end club & district awards · {awardYear}</h1>
          <p className="lcms-awards-sub">
            Clubs and districts are ranked by the same ledger row counts shown on{" "}
            <strong>Foundation contributors & dues</strong> — every table row
            with a Club / District value adds to that tally (duplicates included). Official award rules and CSV
            export can attach here later; this console view is wired to live data now.
          </p>
        </header>

        {error ? <div className="lcms-awards-err">{error}</div> : null}

        <div className="lcms-awards-metrics" role="region" aria-label="Year-end totals">
          <div className="lcms-awards-metric">
            <div className="lcms-awards-metric-label">All ledger rows</div>
            <div className="lcms-awards-metric-value">{ledgerTotal === null ? "—" : ledgerTotal}</div>
            <span className="lcms-awards-metric-note">Matches contributors page “(total)” counter</span>
          </div>
          <div className="lcms-awards-metric">
            <div className="lcms-awards-metric-label">Clubs ranked</div>
            <div className="lcms-awards-metric-value">{clubs.length}</div>
            <span className="lcms-awards-metric-note">Had at least one non-empty club column</span>
          </div>
          <div className="lcms-awards-metric">
            <div className="lcms-awards-metric-label">Rows counted in leaderboard</div>
            <div className="lcms-awards-metric-value">{ledgerWithClub}</div>
            <span className="lcms-awards-metric-note">
              Rows missing club excluded
              {ledgerTotal != null
                ? ` · remainder (no club) ${Math.max(0, ledgerTotal - ledgerWithClub).toLocaleString()}`
                : null}
            </span>
          </div>
        </div>

        <section aria-labelledby="lcms-awards-podium-heading">
          <h2 id="lcms-awards-podium-heading" className="visually-hidden">
            Top three clubs
          </h2>
          <div className="lcms-awards-podium-row" aria-label="Club podium by ledger rows">
            <PodiumTile
              variant="silver"
              headline="#2 · Silver spotlight"
              clubName={top3.silver?.clubName}
              rowCount={top3.silver?.rowCount}
            />
            <PodiumTile
              variant="gold"
              headline="#1 · Outstanding club track"
              clubName={top3.gold?.clubName}
              rowCount={top3.gold?.rowCount}
            />
            <PodiumTile
              variant="bronze"
              headline="#3 · Rising contributor base"
              clubName={top3.bronze?.clubName}
              rowCount={top3.bronze?.rowCount}
            />
          </div>
          {!clubs.length && !error ? (
            <p className="lcms-awards-empty">
              No club names in the ledger yet — add contributors on{" "}
              <Link to="/admin/payments" className="lcms-back-link" style={{ display: "inline" }}>
                Foundation contributors & dues
              </Link>
              .
            </p>
          ) : null}
        </section>

        <div className="lcms-awards-split">
          <section className="lcms-awards-panel" aria-labelledby="lcms-awards-clubs-heading">
            <div className="lcms-awards-panel-head">
              <h2 id="lcms-awards-clubs-heading" className="lcms-awards-panel-title">
                Full club leaderboard
              </h2>
              <p className="lcms-awards-panel-note">
                Sorted by ledger rows descending — identical to counting rows per club column in the
                spreadsheet migration.
              </p>
            </div>
            <div className="lcms-awards-table-wrap">
              {clubs.length ? (
                <table className="lcms-awards-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Club</th>
                      <th>Ledger rows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.map((c, idx) => (
                      <tr key={`${c.clubName}:${idx}`}>
                        <td className="lcms-awards-table-rank">{idx + 1}</td>
                        <td>{c.clubName}</td>
                        <td>{c.rowCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="lcms-awards-empty">{error ? "—" : "No club data"}</p>
              )}
            </div>
          </section>

          <section className="lcms-awards-panel" aria-labelledby="lcms-awards-dist-heading">
            <div className="lcms-awards-panel-head">
              <h2 id="lcms-awards-dist-heading" className="lcms-awards-panel-title">
                District signal
              </h2>
              <p className="lcms-awards-panel-note">
                Sum of ledger rows per district column — groundwork for §6.5.3 district honours.
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
                    </tr>
                  </thead>
                  <tbody>
                    {districts.map((d, idx) => (
                      <tr key={`${d.district}:${idx}`}>
                        <td className="lcms-awards-table-rank">{idx + 1}</td>
                        <td>{d.district}</td>
                        <td>{d.rowCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="lcms-awards-empty">{error ? "—" : "No district data"}</p>
              )}
            </div>
          </section>
        </div>

        <div className="lcms-awards-actions">
          <Link to="/admin/payments" className="lcms-awards-link">
            Open contributor ledger · verify counts →
          </Link>
          <Link to="/admin" className="lcms-awards-link">
            ← Administrator dashboard
          </Link>
        </div>

        <p className="lcms-awards-footer-note">
          <strong>Future layer:</strong> filter by Lions fiscal year / calendar slice, badges for “new memberships”
          vs dues renewals, PDF certificates, CSV for zone chairs — this page is deliberately visual-first until
          those policies are finalized.
        </p>
      </div>
    </div>
  );
}
