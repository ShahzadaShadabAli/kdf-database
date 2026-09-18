"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WithdrawButton } from "./WithdrawButton";
import { RestoreButton } from "./RestoreButton";
import { CaseFilterBar } from "@/components/CaseFilterBar";
import { EMPTY_CASE_FILTERS, hasActiveCaseFilters, matchesCaseFilters } from "@/lib/caseFilters";
import { CnicSearch, HighlightedCnic } from "@/components/CnicSearch";
import { formatDob } from "@/lib/dob";
import { caseGender, caseMaritalStatus, relationText } from "@/lib/caseOptions";

function formatAddress(addr) {
  if (!addr) return "—";
  return `UC ${addr.uc}, Tehsil ${addr.tehsil}, District ${addr.district}`;
}

function CaseTable({ cases, showEdit, cnicQuery, emptyLabel }) {
  if (cases.length === 0) {
    return (
      <div className="empty-note">
        {emptyLabel || (showEdit ? "No cases awaiting Social Welfare." : "No decided or withdrawn cases yet.")}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Case No.</th>
            <th>CNIC</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Marital Status</th>
            <th>Son/Daughter Of</th>
            <th>Spouse</th>
            <th>Date of Birth</th>
            <th>Qualification</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Type of Disability</th>
            <th>Nature of Disability</th>
            <th>Cause of Disability</th>
            <th>Assistive Devices</th>
            <th>Type of Job Can Do</th>
            <th>Source of Income</th>
            <th>Present Address</th>
            <th>Permanent Address</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.cnic}>
              <td>{c.caseType === "old" ? "Old" : "New"}</td>
              <td className="mono">{c.caseNo}</td>
              <td className="mono">
                <HighlightedCnic cnic={c.cnic} query={cnicQuery} />
              </td>
              <td>{c.name}</td>
              <td>{caseGender(c)}</td>
              <td>{caseMaritalStatus(c) || "—"}</td>
              {/* A W/O record names the husband, who is already in the Spouse column. */}
              <td>{c.guardianRelation === "W/O" ? "—" : relationText(c)}</td>
              <td>{c.spouse || "—"}</td>
              <td>{formatDob(c.dob, c.dobYearOnly) || "—"}</td>
              <td>{c.qualification || "—"}</td>
              <td>{c.phone}</td>
              <td>{c.email || "—"}</td>
              <td>{c.disabilityType || "—"}</td>
              <td>{c.natureOfDisability || "—"}</td>
              <td>{c.causeOfDisability || "—"}</td>
              <td>{c.assistiveDevices || "—"}</td>
              <td>{c.jobType || "—"}</td>
              <td>{c.sourceOfIncome || "—"}</td>
              <td>{c.caseType === "old" ? formatAddress(c.address) : formatAddress(c.presentAddress)}</td>
              <td>{formatAddress(c.permanentAddress)}</td>
              <td>
                <span className={`badge ${c.status}`}>{c.status}</span>
              </td>
              <td>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link
                    href={`/kdf/${encodeURIComponent(c.cnic)}/view`}
                    className="btn ghost"
                    style={{ padding: "4px 10px", fontSize: 12, textDecoration: "none" }}
                  >
                    View
                  </Link>
                  {/* Old cases are KDF's own paper records, so they stay editable. */}
                  {(showEdit || c.caseType === "old") && (
                    <Link
                      href={`/kdf/${encodeURIComponent(c.cnic)}`}
                      className="btn ghost"
                      style={{ padding: "4px 10px", fontSize: 12, textDecoration: "none" }}
                    >
                      Edit
                    </Link>
                  )}
                  {showEdit && <WithdrawButton cnic={c.cnic} />}
                  {!showEdit && c.status === "withdrawn" && <RestoreButton cnic={c.cnic} />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KdfCaseSections({ cases }) {
  const [filters, setFilters] = useState(EMPTY_CASE_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const filtersActive = hasActiveCaseFilters(filters);
  const noMatch = filtersActive ? "No matching cases." : undefined;

  const filtered = useMemo(() => cases.filter((c) => matchesCaseFilters(c, filters)), [cases, filters]);
  const referred = filtered.filter((c) => c.status === "referred");
  const completed = filtered.filter((c) => c.status !== "referred");

  return (
    <>
      <CnicSearch
        value={filters.cnic}
        onChange={(cnic) => setFilters((f) => ({ ...f, cnic }))}
        matches={filtered}
        hrefFor={(c) => `/kdf/${encodeURIComponent(c.cnic)}/view`}
      />

      <div className="card">
        <h3>Referred {referred.length ? `(${referred.length})` : ""}</h3>
        <CaseTable cases={referred} showEdit cnicQuery={filters.cnic} emptyLabel={noMatch} />
      </div>

      <div className="card">
        <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Completed {completed.length ? `(${completed.length})` : ""}</span>
          <button
            type="button"
            className="btn ghost"
            style={{ padding: "5px 12px", fontSize: 12 }}
            onClick={() => setShowFilters((v) => !v)}
          >
            {showFilters ? "Hide filters" : "Filter / Search"}
          </button>
        </h3>
        {showFilters && <CaseFilterBar filters={filters} onChange={setFilters} />}
        <CaseTable cases={completed} showEdit={false} cnicQuery={filters.cnic} emptyLabel={noMatch} />
      </div>
    </>
  );
}
