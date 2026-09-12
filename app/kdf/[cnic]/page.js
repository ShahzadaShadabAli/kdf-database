import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/models/Case";
import { Topbar } from "@/components/Topbar";
import { notFound } from "next/navigation";
import Link from "next/link";
import { KdfForm } from "../KdfForm";

function toDateInputValue(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function EditCasePage({ params }) {
  const session = await getServerSession(authOptions);
  const cnic = decodeURIComponent(params.cnic);

  await dbConnect();
  const found = await Case.findOne({ cnic }).lean();
  if (!found) notFound();

  if (found.status !== "referred") {
    return (
      <>
        <Topbar session={session} label="KDF" />
        <div className="page">
          <h1>Edit Case</h1>
          <div className="card">
            <p className="empty-note" style={{ padding: 0 }}>
              {found.status === "verified" || found.status === "rejected"
                ? "Social Welfare has already decided this case, so it can no longer be edited by KDF."
                : "This case has been withdrawn and can no longer be edited."}
            </p>
            <div style={{ marginTop: 12 }}>
              <Link href="/kdf" className="btn ghost" style={{ textDecoration: "none" }}>
                Back to case list
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const initialData = {
    name: found.name,
    gender: found.gender || "Male",
    maritalStatus: found.maritalStatus,
    sonOf: found.sonOf,
    spouse: found.spouse || "",
    dob: toDateInputValue(found.dob),
    cnic: found.cnic,
    qualification: found.qualification || "",
    phone: found.phone || "",
    email: found.email || "",
    assistiveDevices: found.assistiveDevices || "",
    disabilityType: found.disabilityType || "Physically",
    natureOfDisability: found.natureOfDisability,
    causeOfDisability: found.causeOfDisability || "",
    jobType: found.jobType || "",
    sourceOfIncome: found.sourceOfIncome || "",
    presentAddress: {
      uc: found.presentAddress?.uc || "",
      tehsil: found.presentAddress?.tehsil || "",
      district: found.presentAddress?.district || "",
    },
    permanentAddress: {
      uc: found.permanentAddress?.uc || "",
      tehsil: found.permanentAddress?.tehsil || "",
      district: found.permanentAddress?.district || "",
    },
  };

  return (
    <>
      <Topbar session={session} label="KDF" />
      <div className="page">
        <h1>Edit Case — {found.caseNo}</h1>
        <KdfForm mode="edit" initialData={initialData} />
      </div>
    </>
  );
}
