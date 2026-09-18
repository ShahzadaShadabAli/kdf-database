import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCase } from "@/lib/db";
import { Topbar } from "@/components/Topbar";
import { notFound } from "next/navigation";
import Link from "next/link";
import { KdfForm } from "../KdfForm";
import { caseMaritalStatus } from "@/lib/caseOptions";

const blankIfMissing = (addr) => ({
  uc: addr?.uc || "",
  tehsil: addr?.tehsil || "",
  district: addr?.district || "",
});

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

  const found = await getCase(cnic);
  if (!found) notFound();

  // Old cases stay editable; a new case only while it's still referred.
  if (found.caseType !== "old" && found.status !== "referred") {
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

  const shared = {
    name: found.name,
    guardianRelation: found.guardianRelation || "S/O",
    sonOf: found.sonOf || "",
    spouse: found.spouse || "",
    dob: found.dobYearOnly ? "" : toDateInputValue(found.dob),
    dobYearOnly: !!found.dobYearOnly,
    dobYear: found.dobYearOnly ? String(new Date(found.dob).getUTCFullYear()) : "",
    cnic: found.cnic,
    qualification: found.qualification || "",
    phone: found.phone || "",
    email: found.email || "",
    assistiveDevices: found.assistiveDevices || "",
    sourceOfIncome: found.sourceOfIncome || "",
    permanentAddress: blankIfMissing(found.permanentAddress),
  };

  const initialData =
    found.caseType === "old"
      ? {
          ...shared,
          caseType: "old",
          maritalStatus: caseMaritalStatus(found),
          // Old cases entered before the type was asked for have none; the
          // form then makes KDF pick one rather than guessing.
          disabilityType: found.disabilityType || "",
          natureOfDisability: found.natureOfDisability || "",
          fitness: found.fitness || "Fit",
          address: blankIfMissing(found.address),
          certificateNo: found.certificateNo || "",
        }
      : {
          ...shared,
          caseType: "new",
          maritalStatus: found.maritalStatus,
          disabilityType: found.disabilityType || "Physically",
          presentAddress: blankIfMissing(found.presentAddress),
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
