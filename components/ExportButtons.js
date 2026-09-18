import { hasActiveCaseFilters } from "@/lib/caseFilters";

const linkStyle = { padding: "5px 12px", fontSize: 12, textDecoration: "none" };

function exportHref(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value != null) params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `/api/cases/export?${qs}` : "/api/cases/export";
}

// The register download — verified and rejected cases in the paper
// register's layout, sorted by certificate number — offered on both the KDF
// and Social Welfare case lists. "Filtered" applies the current CNIC search
// and filters.
export function ExportButtons({ filters }) {
  return (
    <>
      {hasActiveCaseFilters(filters) && (
        <a href={exportHref(filters)} className="btn ghost" style={linkStyle}>
          Download filtered (Excel)
        </a>
      )}
      <a href="/api/cases/export" className="btn ghost" style={linkStyle}>
        Download all (Excel)
      </a>
    </>
  );
}
