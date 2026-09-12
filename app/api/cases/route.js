import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/models/Case";
import { getNextCaseNo } from "@/lib/caseNo";
import { caseCreateSchema } from "@/lib/validation";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "kdf") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = caseCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    await dbConnect();

    const existing = await Case.findOne({ cnic: data.cnic });
    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.status === "withdrawn"
              ? "This CNIC was withdrawn — restore it from the case list instead of submitting a new one."
              : "A case with this CNIC already exists.",
        },
        { status: 409 }
      );
    }

    const caseNo = await getNextCaseNo();

    const created = await Case.create({
      ...data,
      spouse: data.spouse || undefined,
      qualification: data.qualification || undefined,
      email: data.email || undefined,
      assistiveDevices: data.assistiveDevices || undefined,
      causeOfDisability: data.causeOfDisability || undefined,
      jobType: data.jobType || undefined,
      sourceOfIncome: data.sourceOfIncome || undefined,
      caseNo,
      status: "referred",
      submittedBy: session.user.id,
      submittedAt: new Date(),
      auditLog: [{ action: "submitted", byUser: session.user.id, at: new Date() }],
    });

    return NextResponse.json({ caseNo: created.caseNo, cnic: created.cnic }, { status: 201 });
  } catch (err) {
    console.error("POST /api/cases failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["kdf", "swd"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    // Social Welfare never sees a withdrawn case — withdrawing pulls it out
    // of their queue entirely, same as it was pulled from KDF's own before
    // being referred. KDF sees everything, so they can restore it later.
    const filter = session.user.role === "swd" ? { status: { $ne: "withdrawn" } } : {};

    const cases = await Case.find(filter)
      .sort({ submittedAt: -1 })
      .select("caseNo cnic name status submittedAt")
      .lean();

    return NextResponse.json({ cases });
  } catch (err) {
    console.error("GET /api/cases failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
