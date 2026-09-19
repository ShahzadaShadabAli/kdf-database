"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CaseFilterBar } from "@/components/CaseFilterBar";
import { EMPTY_CASE_FILTERS, hasActiveCaseFilters, matchesCaseFilters, sortByCertificateNo } from "@/lib/caseFilters";
import { CnicSearch, HighlightedCnic } from "@/components/CnicSearch";
import { ExportButtons } from "@/components/ExportButtons";
import { formatDob } from "@/lib/dob";
import { Pager, usePagedRows } from "@/components/Pagination";
import { caseGender, relationText } from "@/lib/caseOptions";

function formatAddress(addr) {
  if (!addr) return "—";
  return `UC ${addr.uc}, Tehsil ${addr.tehsil}, District ${addr.district}`;
}

function CaseTable({ cases, emptyLabel, cnicQuery, resetKey }) {
  const pages = usePagedRows(cases, resetKey);

  if (cases.length === 0) {
    return <div className="empty-note">{emptyLabel}</div>;
  }

  return (
    <>
      <Pager {...pages} />
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Case No.</th>
              <th>CNIC</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Date of Birth</th>
              <th>Phone</th>
              <th>Type of Disability</th>
              <th>Nature of Disability</th>
              <th>Present Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.shown.map((c) => (
              <tr key={c.cnic}>
                <td>{c.caseType === "old" ? "Old" : "New"}</td>
                <td className="mono">{c.caseNo}</td>
                <td className="mono">
                  <HighlightedCnic cnic={c.cnic} query={cnicQuery} />
                </td>
                <td>{c.name}</td>
                <td>{caseGender(c)}</td>
                <td>{formatDob(c.dob, c.dobYearOnly) || "—"}</td>
                <td>{c.phone}</td>
                <td>{c.disabilityType || "—"}</td>
                <td>{c.natureOfDisability}</td>
                <td>{c.caseType === "old" ? formatAddress(c.address) : formatAddress(c.presentAddress)}</td>
                <td>
                  <span className={`badge ${c.status}`}>{c.status}</span>
                </td>
                <td>
                  <Link
                    href={`/swd/${encodeURIComponent(c.cnic)}`}
                    className="btn ghost"
                    style={{ padding: "4px 10px", fontSize: 12, textDecoration: "none" }}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Matches the paper register KDF/Social Welfare already keep: a running
// serial number, no internal case number, and the certificate number
// Social Welfare punches in as the record's real identifier.
function CompletedCaseTable({ cases, emptyLabel, cnicQuery, resetKey }) {
  const pages = usePagedRows(cases, resetKey);

  if (cases.length === 0) {
    return <div className="empty-note">{emptyLabel}</div>;
  }

  return (
    <>
      <Pager {...pages} />
      <div className="table-wrap">
        <table className="data-table data-table-register">
          <thead>
            <tr>
              <th>S.#</th>
              <th>Name of Disable Person / Father's or Husband's Name</th>
              <th>Type/Nature of Disability</th>
              <th>Fit / Unfit</th>
              <th>Date of Birth</th>
              <th>CNIC No.</th>
              <th>Address</th>
              <th>Contact Cell No.</th>
              <th>Certificate No.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.shown.map((c, i) => (
              <tr key={c.cnic}>
                <td>{pages.start + i + 1}</td>
                <td>
                  {c.name} {relationText(c)}
                </td>
                <td>{c.natureOfDisability}</td>
                <td>{c.fitness || "—"}</td>
                <td>{formatDob(c.dob, c.dobYearOnly) || "—"}</td>
                <td className="mono">
                  <HighlightedCnic cnic={c.cnic} query={cnicQuery} />
                </td>
                <td>{c.caseType === "old" ? formatAddress(c.address) : formatAddress(c.presentAddress)}</td>
                <td>{c.phone}</td>
                <td className="mono">{c.certificateNo || "—"}</td>
                <td>
                  <Link
                    href={`/swd/${encodeURIComponent(c.cnic)}`}
                    className="btn ghost"
                    style={{ padding: "4px 10px", fontSize: 12, textDecoration: "none" }}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function SwdCaseSections({ cases }) {
  const [filters, setFilters] = useState(EMPTY_CASE_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const filtersActive = hasActiveCaseFilters(filters);

  const filtered = useMemo(() => cases.filter((c) => matchesCaseFilters(c, filters)), [cases, filters]);
  // Each table goes back to page 1 whenever the search or filters change.
  const resetKey = JSON.stringify(filters);
  const referred = filtered.filter((c) => c.status === "referred");
  // The ledger (and its Excel download) is verified cases only; rejected
  // ones get their own table, which is left out of printouts.
  const completed = filtered.filter((c) => c.status === "verified").sort(sortByCertificateNo);
  const rejected = filtered.filter((c) => c.status === "rejected");

  return (
    <>
      <CnicSearch
        value={filters.cnic}
        onChange={(cnic) => setFilters((f) => ({ ...f, cnic }))}
        matches={filtered}
        hrefFor={(c) => `/swd/${encodeURIComponent(c.cnic)}`}
      />

      <div className="card">
        <h3>Referred {referred.length ? `(${referred.length})` : ""}</h3>
        <CaseTable
          cases={referred}
          cnicQuery={filters.cnic}
          resetKey={resetKey}
          emptyLabel={filtersActive ? "No matching cases." : "No cases awaiting a decision."}
        />
      </div>

      <div className="card">
        <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Completed {completed.length ? `(${completed.length})` : ""}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn ghost"
              style={{ padding: "5px 12px", fontSize: 12 }}
              onClick={() => setShowFilters((v) => !v)}
            >
              {showFilters ? "Hide filters" : "Filter / Search"}
            </button>
            <ExportButtons filters={filters} />
          </div>
        </h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 12, margin: "-8px 0 12px" }}>
          Sorted by certificate number.{" "}
          {filtersActive
            ? "\"Download filtered\" exports only the rows matching your current search and filters, in this same order."
            : "The download includes all verified cases in this same order. Rejected cases are listed separately below and aren't in it."}
        </p>
        {showFilters && <CaseFilterBar filters={filters} onChange={setFilters} />}
        <CompletedCaseTable
          cases={completed}
          cnicQuery={filters.cnic}
          resetKey={resetKey}
          emptyLabel={filtersActive ? "No matching cases." : "No verified cases yet."}
        />
      </div>

      <div className="card no-print">
        <h3>Rejected {rejected.length ? `(${rejected.length})` : ""}</h3>
        <CaseTable
          cases={rejected}
          cnicQuery={filters.cnic}
          resetKey={resetKey}
          emptyLabel={filtersActive ? "No matching cases." : "No rejected cases."}
        />
      </div>
    </>
  );
}
