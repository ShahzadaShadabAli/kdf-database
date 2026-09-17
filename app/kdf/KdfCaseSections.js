"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WithdrawButton } from "./WithdrawButton";
import { RestoreButton } from "./RestoreButton";
import { CaseFilterBar } from "@/components/CaseFilterBar";
import { EMPTY_CASE_FILTERS, matchesCaseFilters } from "@/lib/caseFilters";

function formatAddress(addr) {
  if (!addr) return "—";
  return `UC ${addr.uc}, Tehsil ${addr.tehsil}, District ${addr.district}`;
}

function CaseTable({ cases, showEdit }) {
  if (cases.length === 0) {
    return (
      <div className="empty-note">
        {showEdit ? "No cases awaiting Social Welfare." : "No decided or withdrawn cases yet."}
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
              <td className="mono">{c.cnic}</td>
              <td>{c.name}</td>
              <td>{c.gender || "—"}</td>
              <td>{c.maritalStatus || "—"}</td>
              <td>
                {c.guardianRelation || "S/O"} {c.sonOf}
              </td>
              <td>{c.spouse || "—"}</td>
              <td>{c.dob ? new Date(c.dob).toLocaleDateString() : "—"}</td>
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
              <td>{c.caseType === "old" ? "—" : formatAddress(c.permanentAddress)}</td>
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
                  {showEdit && (
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

  const filtered = useMemo(() => cases.filter((c) => matchesCaseFilters(c, filters)), [cases, filters]);
  const referred = filtered.filter((c) => c.status === "referred");
  const completed = filtered.filter((c) => c.status !== "referred");

  return (
    <>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Referred {referred.length ? `(${referred.length})` : ""}</h3>
        <CaseTable cases={referred} showEdit />
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
        <CaseTable cases={completed} showEdit={false} />
      </div>
    </>
  );
}
