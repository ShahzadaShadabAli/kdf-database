// Options and helpers shared by the forms, validation, tables, filters,
// printed forms and the Excel export. No imports, so this runs in both
// server and browser code.

// The five disability types KDF records, for new and old cases alike.
export const DISABILITY_TYPES = [
  "Physically",
  "Visually",
  "Hearing and Speech",
  "Mentally Retarded",
  "Multiple Disabilities",
];

// Labels used before the types were renamed. Some saved records still carry
// them; they're read as their current equivalents.
export const LEGACY_DISABILITY_TYPES = {
  Hearing: "Hearing and Speech",
  Mentally: "Mentally Retarded",
};

export function currentDisabilityType(type) {
  return LEGACY_DISABILITY_TYPES[type] || type || "";
}

// S/O and D/O are followed by the father's name. W/O ("wife of") is
// followed by the husband's name, which is the applicant's spouse, so it's
// stored as `spouse`. The relation also settles gender: S/O is male, D/O
// and W/O are female.
export const RELATIONS = [
  { value: "S/O", label: "S/O (Son of)" },
  { value: "D/O", label: "D/O (Daughter of)" },
  { value: "W/O", label: "W/O (Wife of)" },
];

export function genderForRelation(relation) {
  return relation === "D/O" || relation === "W/O" ? "Female" : "Male";
}

// The name that follows S/O, D/O or W/O.
export function relationName(c) {
  return (c.guardianRelation === "W/O" ? c.spouse : c.sonOf) || "";
}

// e.g. "S/O Muhammad Ali" or "W/O Ghulam Hussain".
export function relationText(c) {
  return `${c.guardianRelation || "S/O"} ${relationName(c)}`.trim();
}

// Old cases saved before gender followed the relation have none stored.
export function caseGender(c) {
  return c.gender || genderForRelation(c.guardianRelation);
}

// Which cases KDF may delete permanently: its own old-case entries, and new
// cases Social Welfare hasn't decided yet (referred or withdrawn). A new case
// Social Welfare has verified or rejected is an official decision — a
// verified one is in the certificate register — so it stays.
export function kdfCanDelete(c) {
  return c.caseType === "old" || c.status === "referred" || c.status === "withdrawn";
}

// A W/O applicant is married even where no marital status was recorded.
export function caseMaritalStatus(c) {
  return c.maritalStatus || (c.guardianRelation === "W/O" ? "Married" : "");
}
