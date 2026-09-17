import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DbError, updateCase } from "@/lib/db";
import { decisionSchema } from "@/lib/validation";

const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

export async function POST(req, { params }) {
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
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { decision, fitness, natureOfDisability, causeOfDisability, jobType, category, categoryRemarks } =
      parsed.data;

    const updated = await updateCase(cnic, (found) => {
      if (found.status !== "referred") {
        throw new DbError(409, "Only a case still awaiting a decision can be verified or rejected.");
      }
      const now = new Date();
      const next = {
        ...found,
        status: decision,
        swd: { decision, decidedBy: session.user.id, decidedAt: now },
        auditLog: [...found.auditLog, { action: decision, byUser: session.user.id, at: now }],
      };
      // Verifying records the assessment board's actual findings — these
      // replace anything Social Welfare entered earlier while printing the
      // application form, since this is now the confirmed determination.
      // Source of income is KDF's and is left as it is.
      if (decision === "verified") {
        next.fitness = fitness;
        next.natureOfDisability = natureOfDisability;
        next.causeOfDisability = causeOfDisability || undefined;
        next.jobType = jobType || undefined;
        next.category = category || undefined;
        // Remarks only mean something alongside a category.
        next.categoryRemarks = (category && categoryRemarks) || undefined;
      }
      return next;
    });

    return NextResponse.json({ caseNo: updated.caseNo, status: updated.status });
  } catch (err) {
    if (err instanceof DbError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/cases/[cnic]/decision failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
