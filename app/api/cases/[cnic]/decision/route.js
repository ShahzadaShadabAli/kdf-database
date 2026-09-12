import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/models/Case";
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
    const { decision } = parsed.data;

    await dbConnect();
    const found = await Case.findOne({ cnic });
    if (!found) {
      return NextResponse.json({ error: "No case found for this CNIC" }, { status: 404 });
    }
    if (found.status !== "referred") {
      return NextResponse.json(
        { error: "Only a case still awaiting a decision can be verified or rejected." },
        { status: 409 }
      );
    }

    found.status = decision;
    found.swd = {
      decision,
      decidedBy: session.user.id,
      decidedAt: new Date(),
    };
    found.auditLog.push({ action: decision, byUser: session.user.id, at: new Date() });

    await found.save();

    return NextResponse.json({ caseNo: found.caseNo, status: found.status });
  } catch (err) {
    console.error("POST /api/cases/[cnic]/decision failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
