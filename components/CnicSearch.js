"use client";

import { useRouter } from "next/navigation";
import { digitsOnly } from "@/lib/caseFilters";

// Always-visible CNIC search above the case tables. The tables narrow on
// every keystroke; any run of the CNIC's digits matches, with or without
// its dashes. When exactly one case matches, Enter opens it.
export function CnicSearch({ value, onChange, matches, hrefFor }) {
  const router = useRouter();
  const searching = digitsOnly(value) !== "";

  function onKeyDown(e) {
    if (e.key === "Enter" && searching && matches.length === 1) {
      e.preventDefault();
      router.push(hrefFor(matches[0]));
    } else if (e.key === "Escape") {
      onChange("");
    }
  }

  let status = "";
  if (searching) {
    if (matches.length === 0) status = "No case has a CNIC containing these digits.";
    else if (matches.length === 1) status = "1 case matches — press Enter to open it.";
    else status = `${matches.length} cases match.`;
  }

  return (
    <div className="cnic-search">
      <label htmlFor="cnic-search">Search by CNIC</label>
      <div className="cnic-search-row">
        <input
          id="cnic-search"
          className="mono"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d-]/g, ""))}
          onKeyDown={onKeyDown}
          placeholder="Any part of the CNIC, e.g. 71105 or 0000001"
        />
        {value && (
          <button type="button" className="btn ghost" onClick={() => onChange("")}>
            Clear
          </button>
        )}
      </div>
      <p className="cnic-search-status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

// A CNIC with the searched-for digits marked, so it's clear why a row matched.
export function HighlightedCnic({ cnic, query }) {
  const q = digitsOnly(query);
  if (!q || !cnic) return cnic || "";

  const digitAt = []; // position in `cnic` of each of its digits
  for (let i = 0; i < cnic.length; i++) {
    if (/\d/.test(cnic[i])) digitAt.push(i);
  }
  const hit = digitAt.map((i) => cnic[i]).join("").indexOf(q);
  if (hit < 0) return cnic;

  const start = digitAt[hit];
  const end = digitAt[hit + q.length - 1] + 1;
  return (
    <>
      {cnic.slice(0, start)}
      <mark>{cnic.slice(start, end)}</mark>
      {cnic.slice(end)}
    </>
  );
}
