import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DbError, updateCase } from "@/lib/db";
import { assessmentSchema } from "@/lib/validation";

const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

// Saves what Social Welfare enters in the "before printing" pop-up on the
// application form, so the next print of the same case starts from it.
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "swd") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cnic = decodeURIComponent(params.cnic);
    if (!CNIC_REGEX.test(cnic)) {
      return NextResponse.json({ error: "Invalid CNIC format" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = assessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const updated = await updateCase(cnic, (found) => {
      if (found.status === "withdrawn") {
        throw new DbError(404, "No case found for this CNIC");
      }
      if (found.caseType === "old") {
        throw new DbError(409, "Old cases have no application form to print.");
      }
      // The register, the Excel export and the disability certificate all
      // read these two from a verified case, so they can be changed but not
      // cleared.
      if (found.status === "verified" && (!data.natureOfDisability || !data.fitness)) {
        throw new DbError(
          400,
          "A verified case must keep its nature of disability (9) and fit / not fit for work (19–20)."
        );
      }

      return {
        ...found,
        natureOfDisability: data.natureOfDisability || undefined,
        causeOfDisability: data.causeOfDisability || undefined,
        jobType: data.jobType || undefined,
        disabledStatus: data.disabledStatus || undefined,
        impairment: data.impairment || undefined,
        fitness: data.fitness || undefined,
        category: data.category || undefined,
        // Remarks are entered at verification and belong to the category.
        categoryRemarks: data.category ? found.categoryRemarks : undefined,
        disabilityChecks: [...new Set(data.disabilityChecks)],
      };
    });

    return NextResponse.json({
      natureOfDisability: updated.natureOfDisability || "",
      causeOfDisability: updated.causeOfDisability || "",
      jobType: updated.jobType || "",
      disabledStatus: updated.disabledStatus || "",
      impairment: updated.impairment || "",
      fitness: updated.fitness || "",
      category: updated.category || "",
      disabilityChecks: updated.disabilityChecks,
    });
  } catch (err) {
    if (err instanceof DbError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PUT /api/cases/[cnic]/assessment failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
