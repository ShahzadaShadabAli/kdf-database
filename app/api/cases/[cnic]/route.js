import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DbError, getCase, updateCase } from "@/lib/db";
import { caseCreateSchema } from "@/lib/validation";

const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["kdf", "swd"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cnic = decodeURIComponent(params.cnic);
    if (!CNIC_REGEX.test(cnic)) {
      return NextResponse.json({ error: "Invalid CNIC format" }, { status: 400 });
    }

    const found = await getCase(cnic);

    // A withdrawn case is invisible to Social Welfare — as far as they're
    // concerned it's as if it never existed. Only KDF can see it, to
    // restore it.
    if (!found || (found.status === "withdrawn" && session.user.role !== "kdf")) {
      return NextResponse.json({ error: "No case found for this CNIC" }, { status: 404 });
    }

    return NextResponse.json({ case: found });
  } catch (err) {
    console.error("GET /api/cases/[cnic] failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "kdf") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cnic = decodeURIComponent(params.cnic);
    if (!CNIC_REGEX.test(cnic)) {
      return NextResponse.json({ error: "Invalid CNIC format" }, { status: 400 });
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

    // CNIC is editable while a case is still referred — e.g. to fix a typo
    // made at registration — but not once Social Welfare has decided on it.
    const updated = await updateCase(cnic, (found) => {
      if (found.status !== "referred" || data.caseType !== "new") {
        throw new DbError(409, "Only cases still awaiting Social Welfare action can be edited.");
      }
      return {
        ...found,
        cnic: data.cnic,
        name: data.name,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        guardianRelation: data.guardianRelation,
        sonOf: data.sonOf,
        spouse: data.spouse || undefined,
        dob: data.dob,
        qualification: data.qualification || undefined,
        phone: data.phone,
        email: data.email || undefined,
        assistiveDevices: data.assistiveDevices || undefined,
        disabilityType: data.disabilityType,
        natureOfDisability: data.natureOfDisability || undefined,
        causeOfDisability: data.causeOfDisability || undefined,
        jobType: data.jobType || undefined,
        sourceOfIncome: data.sourceOfIncome || undefined,
        presentAddress: data.presentAddress,
        permanentAddress: data.permanentAddress,
        auditLog: [...found.auditLog, { action: "updated", byUser: session.user.id, at: new Date() }],
      };
    });

    return NextResponse.json({ caseNo: updated.caseNo, cnic: updated.cnic });
  } catch (err) {
    if (err instanceof DbError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PUT /api/cases/[cnic] failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "kdf") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cnic = decodeURIComponent(params.cnic);
    if (!CNIC_REGEX.test(cnic)) {
      return NextResponse.json({ error: "Invalid CNIC format" }, { status: 400 });
    }

    const updated = await updateCase(cnic, (found) => {
      if (found.status !== "referred") {
        throw new DbError(409, "Only cases still awaiting Social Welfare action can be withdrawn.");
      }
      return {
        ...found,
        status: "withdrawn",
        auditLog: [...found.auditLog, { action: "withdrawn", byUser: session.user.id, at: new Date() }],
      };
    });

    return NextResponse.json({ caseNo: updated.caseNo, status: updated.status });
  } catch (err) {
    if (err instanceof DbError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("DELETE /api/cases/[cnic] failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
