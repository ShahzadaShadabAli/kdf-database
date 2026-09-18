import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DbError, deleteCase } from "@/lib/db";
import { kdfCanDelete } from "@/lib/caseOptions";

const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

// Permanently deletes a case — unlike DELETE /api/cases/[cnic], which only
// withdraws it. KDF only, and never a new case Social Welfare has decided.
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

    const removed = await deleteCase(
      cnic,
      (found) => {
        if (!kdfCanDelete(found)) {
          throw new DbError(409, "Social Welfare has already decided this case, so it can't be deleted from the KDF site.");
        }
      },
      session.user.id
    );

    return NextResponse.json({ caseNo: removed.caseNo, deleted: true });
  } catch (err) {
    if (err instanceof DbError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("DELETE /api/cases/[cnic]/permanent failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
