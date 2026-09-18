import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listCases } from "@/lib/db";
import { EMPTY_CASE_FILTERS, hasActiveCaseFilters, matchesCaseFilters, sortByCertificateNo } from "@/lib/caseFilters";
import { buildCompletedCasesWorkbook } from "@/lib/caseExport";

// Every response depends on who is signed in, so this must never be rendered
// at build time or cached. Declaring it up front also stops `next build` from
// test-rendering it and logging a "Dynamic server usage" error.
export const dynamic = "force-dynamic";

// The register of decided cases, as an Excel file. Both KDF and Social
// Welfare can download it; admins manage accounts and don't see cases.
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["kdf", "swd"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filters = { ...EMPTY_CASE_FILTERS };
    for (const key of Object.keys(EMPTY_CASE_FILTERS)) {
      const value = searchParams.get(key);
      if (value !== null) filters[key] = value;
    }
    const filtersActive = hasActiveCaseFilters(filters);

    let cases = (await listCases()).filter((c) => c.status === "verified" || c.status === "rejected");
    if (filtersActive) {
      cases = cases.filter((c) => matchesCaseFilters(c, filters));
    }
    cases.sort(sortByCertificateNo);

    const workbook = await buildCompletedCasesWorkbook(
      cases,
      filtersActive ? "Completed Cases (Filtered)" : "Completed Cases"
    );
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filtersActive ? "completed-cases-filtered" : "completed-cases"}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("GET /api/cases/export failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
