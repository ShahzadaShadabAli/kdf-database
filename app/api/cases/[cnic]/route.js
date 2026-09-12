import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/models/Case";
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

    await dbConnect();
    const found = await Case.findOne({ cnic }).lean();

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

    await dbConnect();
    const found = await Case.findOne({ cnic });
    if (!found) {
      return NextResponse.json({ error: "No case found for this CNIC" }, { status: 404 });
    }
    if (found.status !== "referred") {
      return NextResponse.json(
        { error: "Only cases still awaiting Social Welfare action can be edited." },
        { status: 409 }
      );
    }
    // CNIC is editable while a case is still referred — e.g. to fix a typo
    // made at registration — but not once Social Welfare has decided on it.
    if (data.cnic !== cnic) {
      const dup = await Case.findOne({ cnic: data.cnic });
      if (dup) {
        return NextResponse.json(
          {
            error:
              dup.status === "withdrawn"
                ? "That CNIC belongs to a withdrawn case — restore it instead of reassigning it here."
                : "A case with this CNIC already exists.",
          },
          { status: 409 }
        );
      }
    }

    found.cnic = data.cnic;
    found.name = data.name;
    found.gender = data.gender;
    found.maritalStatus = data.maritalStatus;
    found.sonOf = data.sonOf;
    found.spouse = data.spouse || undefined;
    found.dob = data.dob;
    found.qualification = data.qualification || undefined;
    found.phone = data.phone;
    found.email = data.email || undefined;
    found.assistiveDevices = data.assistiveDevices || undefined;
    found.disabilityType = data.disabilityType;
    found.natureOfDisability = data.natureOfDisability;
    found.causeOfDisability = data.causeOfDisability || undefined;
    found.jobType = data.jobType || undefined;
    found.sourceOfIncome = data.sourceOfIncome || undefined;
    found.presentAddress = data.presentAddress;
    found.permanentAddress = data.permanentAddress;
    found.auditLog.push({ action: "updated", byUser: session.user.id, at: new Date() });

    await found.save();

    return NextResponse.json({ caseNo: found.caseNo, cnic: found.cnic });
  } catch (err) {
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

    await dbConnect();
    const found = await Case.findOne({ cnic });
    if (!found) {
      return NextResponse.json({ error: "No case found for this CNIC" }, { status: 404 });
    }
    if (found.status !== "referred") {
      return NextResponse.json(
        { error: "Only cases still awaiting Social Welfare action can be withdrawn." },
        { status: 409 }
      );
    }

    found.status = "withdrawn";
    found.auditLog.push({ action: "withdrawn", byUser: session.user.id, at: new Date() });
    await found.save();

    return NextResponse.json({ caseNo: found.caseNo, status: found.status });
  } catch (err) {
    console.error("DELETE /api/cases/[cnic] failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
