import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/models/Case";

const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "kdf") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cnic = decodeURIComponent(params.cnic);
    if (!CNIC_REGEX.test(cnic)) {
      return NextResponse.json({ error: "Invalid CNIC format" }, { status: 400 });
    }

    await dbConnect();
    const found = await Case.findOne({ cnic });
    if (!found) {
      return NextResponse.json({ error: "No case found for this CNIC" }, { status: 404 });
    }
    if (found.status !== "withdrawn") {
      return NextResponse.json(
        { error: "Only a withdrawn case can be restored." },
        { status: 409 }
      );
    }

    found.status = "referred";
    found.auditLog.push({ action: "restored", byUser: session.user.id, at: new Date() });
    await found.save();

    return NextResponse.json({ caseNo: found.caseNo, status: found.status });
  } catch (err) {
    console.error("POST /api/cases/[cnic]/restore failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
