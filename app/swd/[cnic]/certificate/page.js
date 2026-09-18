import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCase } from "@/lib/db";
import { Topbar } from "@/components/Topbar";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ApplicationForm } from "./ApplicationForm";

export default async function CertificatePage({ params }) {
  const session = await getServerSession(authOptions);
  const cnic = decodeURIComponent(params.cnic);

  const found = await getCase(cnic);
  if (!found || found.status === "withdrawn") notFound();

  if (!found.certificateNo) {
    return (
      <>
        <Topbar session={session} label="Social Welfare" />
        <div className="page">
          <h1>Application Form</h1>
          <div className="card">
            <p className="empty-note" style={{ padding: 0 }}>
              Set a certificate/register number on the case detail page before printing this form.
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
    status: found.status,
    cnic: found.cnic,
    name: found.name,
    guardianRelation: found.guardianRelation || "S/O",
    sonOf: found.sonOf || "",
    maritalStatus: found.maritalStatus,
    spouse: found.spouse || "",
    dob: found.dob,
    dobYearOnly: !!found.dobYearOnly,
    qualification: found.qualification || "",
    disabilityType: found.disabilityType || "",
    natureOfDisability: found.natureOfDisability || "",
    causeOfDisability: found.causeOfDisability || "",
    jobType: found.jobType || "",
    sourceOfIncome: found.sourceOfIncome || "",
    disabledStatus: found.disabledStatus || "",
    impairment: found.impairment || "",
    fitness: found.fitness || "",
    category: found.category || "",
    // null = never saved, so the form falls back to ticking the box that
    // matches the type KDF recorded; [] = deliberately left all unticked.
    disabilityChecks: found.disabilityChecks ?? null,
    phone: found.phone,
    presentAddress: found.presentAddress,
    permanentAddress: found.permanentAddress,
    certificateNo: found.certificateNo,
  };

  return (
    <>
      <div className="no-print">
        <Topbar session={session} label="Social Welfare" />
      </div>
      <div className="page">
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <Link href={`/swd/${encodeURIComponent(found.cnic)}`} className="btn ghost" style={{ textDecoration: "none" }}>
            ← Back to case
          </Link>
        </div>

        <ApplicationForm data={data} />
      </div>
    </>
  );
}
