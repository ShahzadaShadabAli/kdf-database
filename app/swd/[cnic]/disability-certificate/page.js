import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/models/Case";
import { Topbar } from "@/components/Topbar";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DisabilityCertificate } from "./DisabilityCertificate";

export default async function DisabilityCertificatePage({ params }) {
  const session = await getServerSession(authOptions);
  const cnic = decodeURIComponent(params.cnic);

  await dbConnect();
  const found = await Case.findOne({ cnic }).lean();
  if (!found || found.status === "withdrawn") notFound();

  if (found.status !== "verified") {
    return (
      <>
        <Topbar session={session} label="Social Welfare" />
        <div className="page">
          <h1>Disability Certificate</h1>
          <div className="card">
            <p className="empty-note" style={{ padding: 0 }}>
              This certificate can only be printed once the case has been verified.
            </p>
            <div style={{ marginTop: 12 }}>
              <Link href={`/swd/${encodeURIComponent(found.cnic)}`} className="btn ghost" style={{ textDecoration: "none" }}>
                ← Back to case
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const data = {
    cnic: found.cnic,
    name: found.name,
    sonOf: found.sonOf,
    maritalStatus: found.maritalStatus,
    spouse: found.spouse || "",
    dob: found.dob,
    qualification: found.qualification || "",
    natureOfDisability: found.natureOfDisability,
    presentAddress: found.presentAddress,
    permanentAddress: found.permanentAddress,
    decidedAt: found.swd?.decidedAt || null,
  };

  return (
    <>
      <div className="no-print">
        <Topbar session={session} label="Social Welfare" />
      </div>
      <div className="page dcert-page-wrap">
        <DisabilityCertificate data={data} />
      </div>
    </>
  );
}
