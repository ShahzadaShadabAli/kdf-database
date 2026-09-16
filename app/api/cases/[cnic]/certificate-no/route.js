import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DbError, updateCase } from "@/lib/db";
import { certificateNoSchema } from "@/lib/validation";

const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

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
    const parsed = certificateNoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await updateCase(cnic, (found) => {
      if (found.status === "withdrawn") {
        throw new DbError(404, "No case found for this CNIC");
      }
      return { ...found, certificateNo: parsed.data.certificateNo };
    });

    return NextResponse.json({ certificateNo: updated.certificateNo });
  } catch (err) {
    if (err instanceof DbError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("PUT /api/cases/[cnic]/certificate-no failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
