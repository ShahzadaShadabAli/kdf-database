import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCase } from "@/lib/db";
import { Topbar } from "@/components/Topbar";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DisabilityCertificate } from "./DisabilityCertificate";

function Locked({ session, message, cnic }) {
  return (
    <>
      <Topbar session={session} label="Social Welfare" />
      <div className="page">
        <h1>Disability Certificate</h1>
        <div className="card">
          <p className="empty-note" style={{ padding: 0 }}>
            {message}
          </p>
          <div style={{ marginTop: 12 }}>
            <Link href={`/swd/${encodeURIComponent(cnic)}`} className="btn ghost" style={{ textDecoration: "none" }}>
              ← Back to case
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default async function DisabilityCertificatePage({ params }) {
  const session = await getServerSession(authOptions);
  const cnic = decodeURIComponent(params.cnic);

  const found = await getCase(cnic);
  if (!found || found.status === "withdrawn") notFound();

  if (found.status !== "verified") {
    return (
      <Locked
        session={session}
        cnic={found.cnic}
        message="This certificate can only be printed once the case has been verified."
      />
    );
  }

  if (!found.certificateNo) {
    return (
      <Locked
        session={session}
        cnic={found.cnic}
        message="Set a certificate number on the case detail page before printing this certificate."
      />
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
    disabilityType: found.disabilityType || "",
    natureOfDisability: found.natureOfDisability,
    presentAddress: found.presentAddress,
    permanentAddress: found.permanentAddress,
    certificateNo: found.certificateNo,
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
