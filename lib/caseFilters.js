export function computeAge(dob) {
  if (!dob) return null;
  const diffMs = Date.now() - new Date(dob).getTime();
  return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
}

export const EMPTY_CASE_FILTERS = {
  gender: "",
  disability: "",
  uc: "",
  tehsil: "",
  district: "",
  ageMin: "",
  ageMax: "",
};

// Shared by both the KDF and Social Welfare case tables so "filter by age,
// gender, disability, UC, tehsil, district" behaves identically everywhere.
// Old-case records don't have gender, but their single address is the same
// structured UC/Tehsil/District shape as a new case's present address.
export function matchesCaseFilters(c, filters) {
  if (filters.gender && c.gender !== filters.gender) return false;

  if (filters.disability) {
    const haystack = `${c.disabilityType || ""} ${c.natureOfDisability || ""}`.toLowerCase();
    if (!haystack.includes(filters.disability.toLowerCase())) return false;
  }

  const addr = c.caseType === "old" ? c.address : c.presentAddress;

  if (filters.uc) {
    if (!(addr?.uc || "").toLowerCase().includes(filters.uc.toLowerCase())) return false;
  }
  if (filters.tehsil) {
    if (!(addr?.tehsil || "").toLowerCase().includes(filters.tehsil.toLowerCase())) return false;
  }
  if (filters.district) {
    if (!(addr?.district || "").toLowerCase().includes(filters.district.toLowerCase())) return false;
  }

  if (filters.ageMin !== "" && filters.ageMin != null) {
    const age = computeAge(c.dob);
    if (age === null || age < Number(filters.ageMin)) return false;
  }
  if (filters.ageMax !== "" && filters.ageMax != null) {
    const age = computeAge(c.dob);
    if (age === null || age > Number(filters.ageMax)) return false;
  }

  return true;
}

export function hasActiveCaseFilters(filters) {
  return Object.values(filters).some((v) => v !== "" && v != null);
}

// Certificate numbers are alphanumeric (e.g. "0843/2014") and not every
// case has one (only old-case backfills carry a paper certificate number
// today) — cases without one sort to the end rather than first.
export function sortByCertificateNo(a, b) {
  const aNo = a.certificateNo || "";
  const bNo = b.certificateNo || "";
  if (!aNo && !bNo) return 0;
  if (!aNo) return 1;
  if (!bNo) return -1;
  return aNo.localeCompare(bNo, undefined, { numeric: true, sensitivity: "base" });
}
