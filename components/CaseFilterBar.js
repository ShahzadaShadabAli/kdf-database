"use client";

import { EMPTY_CASE_FILTERS } from "@/lib/caseFilters";

export function CaseFilterBar({ filters, onChange }) {
  function set(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px 18px",
        margin: "12px 0 16px",
        background: "var(--bg)",
      }}
    >
      <div className="grid grid-3">
        <div className="field">
          <label>Gender</label>
          <select value={filters.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Any</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Disability</label>
          <input
            value={filters.disability}
            onChange={(e) => set("disability", e.target.value)}
            placeholder="e.g. visually, physically"
          />
        </div>
        <div className="field">
          <label>Age range</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              min="0"
              value={filters.ageMin}
              onChange={(e) => set("ageMin", e.target.value)}
              placeholder="Min"
            />
            <input
              type="number"
              min="0"
              value={filters.ageMax}
              onChange={(e) => set("ageMax", e.target.value)}
              placeholder="Max"
            />
          </div>
        </div>
        <div className="field">
          <label>Union Council</label>
          <input value={filters.uc} onChange={(e) => set("uc", e.target.value)} placeholder="UC" />
        </div>
        <div className="field">
          <label>Tehsil</label>
          <input value={filters.tehsil} onChange={(e) => set("tehsil", e.target.value)} />
        </div>
        <div className="field">
          <label>District</label>
          <input value={filters.district} onChange={(e) => set("district", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn ghost"
          style={{ padding: "5px 12px", fontSize: 12 }}
          onClick={() => onChange(EMPTY_CASE_FILTERS)}
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
