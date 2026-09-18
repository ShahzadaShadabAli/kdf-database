// Some older CNICs record only a birth year. Those are stored as 1 January
// of that year (UTC) with `dobYearOnly: true`, so sorting and the age
// filter keep working, and every place that shows the date shows the year
// alone. No imports: this runs in both server and browser code.

export function formatDob(dob, yearOnly) {
  if (!dob) return "";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "";
  return yearOnly ? String(d.getUTCFullYear()) : d.toLocaleDateString();
}

// The stored date for a year-only birth date.
export function yearOnlyDob(year) {
  return new Date(Date.UTC(Number(year), 0, 1));
}
