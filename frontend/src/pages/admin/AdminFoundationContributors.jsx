import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiJson } from "../../utils/api";
import "../../styles/adminDashboard.css";

/** Matches export/import template column order */
const CSV_COLUMNS = [
  "Tag",
  "No",
  "Date",
  "Name",
  "District",
  "Club",
  "Kind",
  "CashRs",
  "CashCts",
  "ChequeAmt",
  "Bank",
  "ChqNo",
  "Flagged",
  "FlagNote",
  "Notes",
];

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function IconExportSheet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <rect x="3" y="3" width="15" height="18" rx="2" ry="2" />
      <line x1="7" x2="17" y1="21" y2="21" />
      <polyline points="8 21 12 17 16 21" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" fill="none" />
    </svg>
  );
}

const INITIAL_FORM = {
  entryNumber: "",
  contributorTag: "",
  contributionDate: "",
  contributorName: "",
  district: "",
  clubName: "",
  paymentKind: "cash",
  cashRupees: "",
  cashCents: "",
  chequeAmount: "",
  chequeBank: "",
  chequeNumber: "",
  flagged: false,
  flagNote: "",
  notes: "",
};

function isoToDateInput(iso) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function fmtShort(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatMoney(n) {
  if (n == null || n === "") return "—";
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function csvEscape(cell) {
  const s = cell == null ? "" : String(cell);
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function contributorToCsvRow(c) {
  return [
    c.contributorTag,
    c.entryNumber ?? "",
    isoToDateInput(c.contributionDate),
    c.contributorName,
    c.district,
    c.clubName,
    c.paymentKind,
    c.cashRupees ?? "",
    c.cashCents ?? "",
    c.chequeAmount ?? "",
    c.chequeBank,
    c.chequeNumber,
    c.flagged ? "yes" : "no",
    c.flagNote,
    c.notes,
  ]
    .map(csvEscape)
    .join(",");
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cur += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      out.push(cur.trim());
      cur = "";
      i++;
      continue;
    }
    cur += c;
    i++;
  }
  out.push(cur.trim());
  return out;
}

/** @returns {Record<string, number>} */
function headerToIndex(headerCells) {
  const cells = headerCells.map((h) => String(h).trim().replace(/^\ufeff/g, ""));
  const lower = {};
  cells.forEach((h, idx) => {
    lower[h.toLowerCase()] = idx;
  });
  const ix = {};
  for (const col of CSV_COLUMNS) {
    const j = lower[col.toLowerCase()];
    ix[col] = j === undefined ? -1 : j;
  }
  return ix;
}

function cellAt(ix, cols, name) {
  const i = ix[name];
  if (i === undefined || i < 0) return "";
  return cols[i] != null ? String(cols[i]).trim() : "";
}

/** @returns yyyy-mm-dd for API date input */
function parseFlexibleDate(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  const iso = /^(\d{4})-(\d{2})-(\d{2})/;
  const im = iso.exec(s);
  if (im) return `${im[1]}-${im[2]}-${im[3]}`;

  const eu = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(s);
  if (eu) {
    const d = eu[1].padStart(2, "0");
    const mo = eu[2].padStart(2, "0");
    let yr = eu[3];
    if (yr.length === 2) yr = Number(yr) > 67 ? `19${yr}` : `20${yr}`;
    return `${yr}-${mo}-${d}`;
  }

  const us = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(s);
  if (us) {
    const mo = us[1].padStart(2, "0");
    const da = us[2].padStart(2, "0");
    return `${us[3]}-${mo}-${da}`;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return isoToDateInput(d.toISOString());

  return "";
}

function csvRowToApiBody(ix, cols) {
  const contributorName = cellAt(ix, cols, "Name");
  const kindRaw = cellAt(ix, cols, "Kind").toLowerCase();
  const paymentKind =
    kindRaw.includes("bank") ? "bank" : kindRaw.includes("cheq") ? "cheque" : "cash";
  const dateIso = parseFlexibleDate(cellAt(ix, cols, "Date"));

  if (!contributorName) return null;
  if (!dateIso) return null;

  const no = cellAt(ix, cols, "No");
  const flagRaw = cellAt(ix, cols, "Flagged");

  /** @type {Record<string, unknown>} */
  const body = {
    contributorTag: cellAt(ix, cols, "Tag"),
    contributionDate: dateIso,
    contributorName,
    district: cellAt(ix, cols, "District"),
    clubName: cellAt(ix, cols, "Club"),
    paymentKind,
    flagged: /^y(es)?|true|1$/i.test(flagRaw.trim()),
    flagNote: cellAt(ix, cols, "FlagNote"),
    notes: cellAt(ix, cols, "Notes"),
    cashRupees: "",
    cashCents: "",
    chequeAmount: "",
    chequeBank: "",
    chequeNumber: "",
  };

  if (no !== "") {
    const n = Number(no);
    if (Number.isFinite(n) && n >= 0) body.entryNumber = n;
  }

  if (paymentKind === "cash") {
    body.cashRupees = cellAt(ix, cols, "CashRs");
    body.cashCents = cellAt(ix, cols, "CashCts");
  } else if (paymentKind === "bank") {
    body.chequeAmount = cellAt(ix, cols, "ChequeAmt");
    body.chequeBank = cellAt(ix, cols, "Bank");
    body.chequeNumber = "";
  } else {
    body.chequeAmount = cellAt(ix, cols, "ChequeAmt");
    body.chequeBank = cellAt(ix, cols, "Bank");
    body.chequeNumber = cellAt(ix, cols, "ChqNo");
  }

  return body;
}

export default function AdminFoundationContributors() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const [district, setDistrict] = useState("");
  const [club, setClub] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tag, setTag] = useState("");
  const [kind, setKind] = useState("");

  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const importFileRef = useRef(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 380);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    const raw = searchParams.get("district");
    if (raw != null && String(raw).trim() !== "") {
      setDistrict(String(raw).trim());
    }
  }, [searchParams]);

  const buildQs = useCallback(() => {
    const p = new URLSearchParams();
    if (district.trim()) p.set("district", district.trim());
    if (club.trim()) p.set("club", club.trim());
    if (debouncedSearch) p.set("search", debouncedSearch);
    if (tag.trim()) p.set("tag", tag.trim());
    if (kind) p.set("kind", kind);
    const q = p.toString();
    return q ? `?${q}` : "";
  }, [district, club, debouncedSearch, tag, kind]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listRes, countRes] = await Promise.all([
        apiJson(`/api/contributions${buildQs()}`, { token }),
        apiJson(`/api/contributions/count`, { token }),
      ]);
      setRows(Array.isArray(listRes.contributions) ? listRes.contributions : []);
      const t = countRes?.total;
      setLedgerTotal(typeof t === "number" && Number.isFinite(t) ? t : 0);
    } catch (e) {
      setRows([]);
      setLedgerTotal(0);
      setError(e.message || "Could not load contributions.");
    } finally {
      setLoading(false);
    }
  }, [token, buildQs]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, contributionDate: isoToDateInput(new Date().toISOString()) });
    setModalOpen(true);
    setNote("");
    setError("");
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      entryNumber: row.entryNumber != null ? String(row.entryNumber) : "",
      contributorTag: row.contributorTag ?? "",
      contributionDate: isoToDateInput(row.contributionDate),
      contributorName: row.contributorName ?? "",
      district: row.district ?? "",
      clubName: row.clubName ?? "",
      paymentKind: row.paymentKind,
      cashRupees: row.cashRupees != null ? String(row.cashRupees) : "",
      cashCents: row.cashCents != null ? String(row.cashCents) : "",
      chequeAmount: row.chequeAmount != null ? String(row.chequeAmount) : "",
      chequeBank: row.chequeBank ?? "",
      chequeNumber: row.chequeNumber ?? "",
      flagged: Boolean(row.flagged),
      flagNote: row.flagNote ?? "",
      notes: row.notes ?? "",
    });
    setModalOpen(true);
    setNote("");
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNote("");
    const body = {
      entryNumber: form.entryNumber,
      contributorTag: form.contributorTag,
      contributionDate: form.contributionDate,
      contributorName: form.contributorName.trim(),
      district: form.district,
      clubName: form.clubName,
      paymentKind: form.paymentKind,
      cashRupees: form.paymentKind === "cash" ? form.cashRupees : "",
      cashCents: form.paymentKind === "cash" ? form.cashCents : "",
      chequeAmount:
        form.paymentKind === "cheque" || form.paymentKind === "bank" ? form.chequeAmount : "",
      chequeBank: form.paymentKind === "cheque" || form.paymentKind === "bank" ? form.chequeBank : "",
      chequeNumber: form.paymentKind === "cheque" ? form.chequeNumber : "",
      flagged: form.flagged,
      flagNote: form.flagNote,
      notes: form.notes,
    };

    try {
      if (editingId) {
        await apiJson(`/api/contributions/${editingId}`, { method: "PATCH", token, body });
        setNote("Entry saved.");
      } else {
        await apiJson("/api/contributions", { method: "POST", token, body });
        setNote("Entry added.");
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.message || "Could not save entry.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Remove this ledger row?")) return;
    try {
      await apiJson(`/api/contributions/${id}`, { method: "DELETE", token });
      setNote("Entry removed.");
      await load();
    } catch (e) {
      setError(e.message || "Could not delete.");
    }
  }

  function downloadCsvTemplate() {
    const blob = new Blob([`${CSV_COLUMNS.join(",")}\n`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lanka-lions-foundation-contributions-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openImportCsv() {
    setError("");
    setNote("");
    importFileRef.current?.click();
  }

  async function handleImportCsv(e) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      setNote("");
      setError(
        "Excel workbooks (.xlsx) are not read in the browser. In Excel choose Save As → CSV UTF-8, then upload the .csv."
      );
      return;
    }

    setImporting(true);
    setError("");
    setNote("");
    try {
      const text = await file.text();
      const lines = text.replace(/^\ufeff/, "").split(/\r?\n/).filter((ln) => ln.trim().length);
      if (lines.length < 2) {
        setError("CSV has no data rows (only headers or empty).");
        return;
      }

      const ix = headerToIndex(parseCsvLine(lines[0]));
      if (ix.Name < 0 || ix.Date < 0) {
        setError(`CSV headers must include Date and Name (same spelling as Template: ${CSV_COLUMNS.join(",")}).`);
        return;
      }

      /** @type {Record<string, unknown>[]} */
      const payloads = [];
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (!cols.some((c) => String(c).trim().length)) continue;
        const body = csvRowToApiBody(ix, cols);
        if (!body) {
          skipped++;
          continue;
        }
        payloads.push(body);
      }

      if (payloads.length === 0) {
        setError(`No valid rows to import (${skipped} skipped — need Name + valid Date on each row).`);
        return;
      }

      let imported = 0;
      /** @type {string[]} */
      const failures = [];
      for (const body of payloads) {
        try {
          await apiJson("/api/contributions", { method: "POST", token, body });
          imported++;
        } catch (err) {
          failures.push(err instanceof Error ? err.message : "Request failed");
        }
      }

      const failMsg = failures.length ? ` Errors: ${failures.slice(0, 5).join(" · ")}${failures.length > 5 ? "…" : ""}` : "";
      setNote(`Imported ${imported} of ${payloads.length} rows.${skipped ? ` (${skipped} rows skipped)` : ""}${failMsg}`);
      await load();
    } catch (err) {
      setNote("");
      setError(err instanceof Error ? err.message : "Could not read CSV.");
    } finally {
      setImporting(false);
    }
  }

  function exportCsv() {
    const header = CSV_COLUMNS.join(",");
    const lines = [header, ...rows.map(contributorToCsvRow)].join("\n");
    const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lanka-lions-foundation-contributions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="lcms-admin-card lcms-ledger-page">
      <Link to="/admin" className="lcms-back-link">
        ← BACK
      </Link>

      <div className="lcms-ledger-header">
        <div className="lcms-ledger-header-text">
          <h1 className="lcms-page-title">Foundation contributors & dues</h1>
          <p className="lcms-ledger-subtitle">
            Manage foundation contributors and dues{" "}
            <span className="lcms-ledger-subtitle-count">
              ({ledgerTotal.toLocaleString()} total
              {debouncedSearch || district.trim() || club.trim() || tag.trim() || kind
                ? ` · ${rows.length} match filters`
                : ""}
              )
            </span>
          </p>
        </div>
        <div className="lcms-ledger-header-actions">
          <input
            ref={importFileRef}
            type="file"
            accept=".csv,text/csv"
            aria-hidden
            tabIndex={-1}
            style={{ display: "none" }}
            onChange={handleImportCsv}
          />
          <button
            type="button"
            className="lcms-btn-ghost lcms-btn-with-icon"
            onClick={downloadCsvTemplate}
            disabled={importing}
          >
            <IconDownload />
            Template
          </button>
          <button
            type="button"
            className="lcms-btn-ghost lcms-btn-with-icon"
            onClick={openImportCsv}
            disabled={importing}
          >
            <IconUpload />
            {importing ? "Uploading…" : "Upload Excel"}
          </button>
          <button
            type="button"
            className="lcms-btn-ghost lcms-btn-with-icon"
            onClick={exportCsv}
            disabled={!rows.length || importing}
          >
            <IconExportSheet />
            Export
          </button>
          <button
            type="button"
            className="lcms-btn-add-entry lcms-btn-with-icon"
            onClick={openAdd}
            disabled={importing}
          >
            <IconPlus />
            New entry
          </button>
        </div>
      </div>

      {note && <div className="lcms-alert lcms-alert-ok">{note}</div>}
      {error && <div className="lcms-alert lcms-alert-err">{error}</div>}

      <div className="lcms-ledger-search-shell">
        <div className="lcms-ledger-search-row">
          <div className="lcms-ledger-search-wrap">
            <span className="lcms-ledger-search-icon" aria-hidden>
              <IconSearch />
            </span>
            <input
              id="lcms-ledger-q"
              className="lcms-ledger-search-input"
              placeholder="Search by contributor name, club, district, or notes…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
              aria-label="Search contributions"
            />
          </div>
          <button
            type="button"
            className="lcms-btn-filters lcms-btn-with-icon"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
          >
            <IconFilter />
            Filters
          </button>
        </div>

        {filtersOpen ? (
          <div className="lcms-ledger-filters-drawer">
            <div className="lcms-ledger-filters-grid">
              <div className="lcms-form-field">
                <label htmlFor="ff-tag">Tag (PMJF, …)</label>
                <input
                  id="ff-tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="PMJF"
                  autoComplete="off"
                />
              </div>
              <div className="lcms-form-field">
                <label htmlFor="ff-district">District</label>
                <input id="ff-district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="306 C2" />
              </div>
              <div className="lcms-form-field">
                <label htmlFor="ff-club">Club contains</label>
                <input id="ff-club" value={club} onChange={(e) => setClub(e.target.value)} placeholder="Nugegoda" />
              </div>
              <div className="lcms-form-field">
                <label htmlFor="ff-kind">Pay type</label>
                <select id="ff-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="">All</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
            </div>
            <div className="lcms-ledger-filters-footer">
              <button type="button" className="lcms-btn-ghost lcms-btn-with-icon" onClick={() => load()} disabled={loading}>
                Apply filters
              </button>
              <span className="lcms-muted" style={{ fontSize: "0.8rem", alignSelf: "center" }}>
                Search applies automatically; structured filters refresh when you apply.
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <p className="lcms-ledger-upload-hint lcms-muted">
        <strong>CSV import:</strong> use <strong>Template</strong> headers.{" "}
        <strong>Kind</strong> may be <strong>cash</strong>, <strong>cheque</strong>, or <strong>bank</strong> (cheque amounts and bank transfers use{" "}
        <strong>ChequeAmt</strong> plus <strong>Bank</strong> column). In Excel use <em>Save As → CSV UTF-8</em> before{" "}
        <strong>Upload Excel</strong>. One spreadsheet row creates one ledger line.
      </p>

      {loading ? (
        <p className="lcms-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p>No rows match. Add entries here or widen filters.</p>
      ) : (
        <div className="lcms-table-wrap">
          <table className="lcms-table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>No</th>
                <th>Date</th>
                <th>Name</th>
                <th>District</th>
                <th>Club</th>
                <th>Cash (Rs)</th>
                <th>Chq / bank</th>
                <th style={{ width: 160 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={c.flagged ? "lcms-row-flagged" : undefined}>
                  <td>
                    {c.contributorTag ? (
                      <span className="lcms-chip lcms-chip-fdn">{c.contributorTag}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{c.entryNumber != null ? c.entryNumber : "—"}</td>
                  <td>{fmtShort(c.contributionDate)}</td>
                  <td>{c.contributorName}</td>
                  <td>{c.district || "—"}</td>
                  <td>{c.clubName || "—"}</td>
                  <td>
                    {c.paymentKind === "cash" ? (
                      <>
                        {formatMoney(c.cashRupees)}
                        {c.cashCents != null && Number(c.cashCents) > 0
                          ? ` · ${Number(c.cashCents)} cts`
                          : ""}
                      </>
                    ) : c.paymentKind === "bank" ? (
                      <span className="lcms-muted">bank</span>
                    ) : (
                      <span className="lcms-muted">cheque</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {c.paymentKind === "cheque" || c.paymentKind === "bank" ? (
                      <>
                        <strong>{formatMoney(c.chequeAmount)}</strong>
                        {(c.chequeBank || c.chequeNumber) && (
                          <div className="lcms-muted" style={{ fontSize: "0.78rem", marginTop: 2 }}>
                            {[c.chequeBank, c.chequeNumber].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className="lcms-table-actions">
                      <button
                        type="button"
                        className="lcms-btn-ghost"
                        style={{ padding: "0.3rem 0.55rem", fontSize: "0.76rem", fontWeight: 700 }}
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </button>
                      <button type="button" className="lcms-btn-danger" onClick={() => onDelete(c.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen ? (
        <div
          className="lcms-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ff-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="lcms-modal-panel">
            <div className="lcms-modal-head">
              <h2 id="ff-modal-title" className="lcms-page-title" style={{ margin: 0 }}>
                {editingId ? "Edit contribution" : "New contribution"}
              </h2>
              <button type="button" className="lcms-modal-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={onSave}>
              <div className="lcms-form-row-2">
                <div className="lcms-form-field">
                  <label htmlFor="ff-no">Ledger no (Excel NO)</label>
                  <input
                    id="ff-no"
                    type="number"
                    min={0}
                    value={form.entryNumber}
                    onChange={(e) => setForm((f) => ({ ...f, entryNumber: e.target.value }))}
                  />
                </div>
                <div className="lcms-form-field">
                  <label htmlFor="ff-ct">Tag</label>
                  <input
                    id="ff-ct"
                    value={form.contributorTag}
                    onChange={(e) => setForm((f) => ({ ...f, contributorTag: e.target.value }))}
                    placeholder="PMJF, PMAF, …"
                  />
                </div>
              </div>
              <div className="lcms-form-field">
                <label htmlFor="ff-name">Contributor name</label>
                <input
                  id="ff-name"
                  required
                  value={form.contributorName}
                  onChange={(e) => setForm((f) => ({ ...f, contributorName: e.target.value }))}
                  placeholder="e.g. Lion Jane Perera"
                />
              </div>
              <div className="lcms-form-row-2">
                <div className="lcms-form-field">
                  <label htmlFor="ff-dist">District</label>
                  <input
                    id="ff-dist"
                    value={form.district}
                    onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                    placeholder="306 C2"
                  />
                </div>
                <div className="lcms-form-field">
                  <label htmlFor="ff-cn">Club name</label>
                  <input
                    id="ff-cn"
                    value={form.clubName}
                    onChange={(e) => setForm((f) => ({ ...f, clubName: e.target.value }))}
                  />
                </div>
              </div>

              <h3 className="lcms-form-section-title">Contribution type</h3>
              <div className="lcms-form-field">
                <label htmlFor="ff-kind-modal">Payment</label>
                <select
                  id="ff-kind-modal"
                  value={form.paymentKind}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      paymentKind: e.target.value,
                    }))
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank">Bank</option>
                </select>
              </div>

              <div className="lcms-form-field">
                <label htmlFor="ff-date">Payment date</label>
                <input
                  id="ff-date"
                  type="date"
                  required
                  value={form.contributionDate}
                  onChange={(e) => setForm((f) => ({ ...f, contributionDate: e.target.value }))}
                />
                <span className="lcms-muted" style={{ fontSize: "0.8rem", display: "block", marginTop: "0.25rem" }}>
                  Applies to cash, cheque, and bank transfers.
                </span>
              </div>

              {form.paymentKind === "cash" ? (
                <div className="lcms-form-row-2">
                  <div className="lcms-form-field">
                    <label htmlFor="ff-rs">Rupees</label>
                    <input
                      id="ff-rs"
                      type="number"
                      step="any"
                      value={form.cashRupees}
                      onChange={(e) => setForm((f) => ({ ...f, cashRupees: e.target.value }))}
                    />
                  </div>
                  <div className="lcms-form-field">
                    <label htmlFor="ff-cts">Cents</label>
                    <input
                      id="ff-cts"
                      type="number"
                      step="any"
                      value={form.cashCents}
                      onChange={(e) => setForm((f) => ({ ...f, cashCents: e.target.value }))}
                    />
                  </div>
                </div>
              ) : form.paymentKind === "cheque" ? (
                <>
                  <div className="lcms-form-field">
                    <label htmlFor="ff-chamt">Cheque amount</label>
                    <input
                      id="ff-chamt"
                      type="number"
                      step="any"
                      value={form.chequeAmount}
                      onChange={(e) => setForm((f) => ({ ...f, chequeAmount: e.target.value }))}
                    />
                  </div>
                  <div className="lcms-form-row-2">
                    <div className="lcms-form-field">
                      <label htmlFor="ff-bank">Bank</label>
                      <input
                        id="ff-bank"
                        value={form.chequeBank}
                        onChange={(e) => setForm((f) => ({ ...f, chequeBank: e.target.value }))}
                        placeholder="Sampath, BOC…"
                      />
                    </div>
                    <div className="lcms-form-field">
                      <label htmlFor="ff-chqno">Cheque number</label>
                      <input
                        id="ff-chqno"
                        value={form.chequeNumber}
                        onChange={(e) => setForm((f) => ({ ...f, chequeNumber: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="lcms-form-field">
                    <label htmlFor="ff-bank-amt">Transfer amount</label>
                    <input
                      id="ff-bank-amt"
                      type="number"
                      step="any"
                      value={form.chequeAmount}
                      onChange={(e) => setForm((f) => ({ ...f, chequeAmount: e.target.value }))}
                    />
                  </div>
                  <div className="lcms-form-field">
                    <label htmlFor="ff-bank-name">Bank</label>
                    <input
                      id="ff-bank-name"
                      value={form.chequeBank}
                      onChange={(e) => setForm((f) => ({ ...f, chequeBank: e.target.value }))}
                      placeholder="Sampath, BOC, HNB…"
                    />
                  </div>
                </>
              )}

              <h3 className="lcms-form-section-title">Flags & notes</h3>
              <div className="lcms-role-row" style={{ borderTop: "none", paddingTop: 0 }}>
                <div className="lcms-role-meta">
                  <strong>Flag row</strong>
                  <span>Highlight workbook-style follow-ups.</span>
                </div>
                <label className="lcms-toggle">
                  <input
                    type="checkbox"
                    checked={form.flagged}
                    onChange={(e) => setForm((f) => ({ ...f, flagged: e.target.checked }))}
                  />
                  <span className="lcms-toggle-ui" aria-hidden />
                </label>
              </div>
              <div className="lcms-form-field">
                <label htmlFor="ff-flagnote">Flag note</label>
                <input
                  id="ff-flagnote"
                  value={form.flagNote}
                  onChange={(e) => setForm((f) => ({ ...f, flagNote: e.target.value }))}
                  placeholder="e.g. cheque follow-up"
                />
              </div>
              <div className="lcms-form-field">
                <label htmlFor="ff-notes">Internal notes</label>
                <textarea
                  id="ff-notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", gap: "0.65rem", marginTop: "1.35rem", flexWrap: "wrap" }}>
                <button type="submit" className="lcms-primary-btn" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add contribution"}
                </button>
                <button type="button" className="lcms-btn-ghost" disabled={saving} onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
