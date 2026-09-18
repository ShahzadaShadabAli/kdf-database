import { caseGender, currentDisabilityType } from "./caseOptions";

export function computeAge(dob) {
  if (!dob) return null;
  const diffMs = Date.now() - new Date(dob).getTime();
  return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
}

export const EMPTY_CASE_FILTERS = {
  gender: "",
  disabilityType: "",
  nature: "",
  uc: "",
  tehsil: "",
  district: "",
  ageMin: "",
  ageMax: "",
};

// Shared by both the KDF and Social Welfare case tables so "filter by age,
// gender, disability, UC, tehsil, district" behaves identically everywhere.
// Gender follows the relation (S/O male, D/O and W/O female), which also
// covers old cases saved before gender was stored. An old case's single
// address is the same UC/Tehsil/District shape as a new case's present one.
export function matchesCaseFilters(c, filters) {
  if (filters.gender && caseGender(c) !== filters.gender) return false;

  // Records under the pre-rename labels ("Hearing", "Mentally") match their
  // current type.
  if (filters.disabilityType && currentDisabilityType(c.disabilityType) !== filters.disabilityType) return false;

  if (filters.nature) {
    if (!(c.natureOfDisability || "").toLowerCase().includes(filters.nature.toLowerCase())) return false;
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
