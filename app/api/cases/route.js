import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DbError, createCase, listCases } from "@/lib/db";
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
    const now = new Date();

    // A backfilled "old" case is a pre-existing paper record KDF is typing
    // in, not a new referral — it never goes through Social Welfare's queue,
    // it's simply on record as verified from the moment it's entered.
    const isOldCase = data.caseType === "old";
    const auditLog = [{ action: "submitted", byUser: session.user.id, at: now }];
    if (isOldCase) {
      auditLog.push({ action: "verified", byUser: session.user.id, at: now });
    }

    const created = await createCase({
      ...data,
      spouse: data.spouse || undefined,
      qualification: data.qualification || undefined,
      email: data.email || undefined,
      assistiveDevices: data.assistiveDevices || undefined,
      natureOfDisability: data.natureOfDisability || undefined,
      causeOfDisability: data.causeOfDisability || undefined,
      jobType: data.jobType || undefined,
      sourceOfIncome: data.sourceOfIncome || undefined,
      status: isOldCase ? "verified" : "referred",
      swd: isOldCase ? { decision: "verified", decidedAt: now } : undefined,
      submittedBy: session.user.id,
      submittedAt: now,
      auditLog,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof DbError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
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

    // Social Welfare never sees a withdrawn case — withdrawing pulls it out
    // of their queue entirely. KDF sees everything, so they can restore it.
    const all = await listCases();
    const visible = session.user.role === "swd" ? all.filter((c) => c.status !== "withdrawn") : all;
    const cases = visible.map(({ caseNo, cnic, name, status, submittedAt }) => ({
      caseNo,
      cnic,
      name,
      status,
      submittedAt,
    }));

    return NextResponse.json({ cases });
  } catch (err) {
    console.error("GET /api/cases failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
