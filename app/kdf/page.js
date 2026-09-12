import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/models/Case";
import { Topbar } from "@/components/Topbar";
import Link from "next/link";
import { WithdrawButton } from "./WithdrawButton";
import { RestoreButton } from "./RestoreButton";

function formatAddress(addr) {
  if (!addr) return "—";
  return `UC ${addr.uc}, Tehsil ${addr.tehsil}, District ${addr.district}`;
}

function CaseTable({ cases, showEdit }) {
  if (cases.length === 0) {
    return (
      <div className="empty-note">
        {showEdit ? "No cases awaiting Social Welfare." : "No decided or withdrawn cases yet."}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Case No.</th>
            <th>CNIC</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Marital Status</th>
            <th>Son/Daughter Of</th>
            <th>Spouse</th>
            <th>Date of Birth</th>
            <th>Qualification</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Type of Disability</th>
            <th>Nature of Disability</th>
            <th>Cause of Disability</th>
            <th>Assistive Devices</th>
            <th>Type of Job Can Do</th>
            <th>Source of Income</th>
            <th>Present Address</th>
            <th>Permanent Address</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.cnic}>
              <td className="mono">{c.caseNo}</td>
              <td className="mono">{c.cnic}</td>
              <td>{c.name}</td>
              <td>{c.gender || "—"}</td>
              <td>{c.maritalStatus}</td>
              <td>{c.sonOf}</td>
              <td>{c.spouse || "—"}</td>
              <td>{c.dob ? new Date(c.dob).toLocaleDateString() : "—"}</td>
              <td>{c.qualification || "—"}</td>
              <td>{c.phone}</td>
              <td>{c.email || "—"}</td>
              <td>{c.disabilityType}</td>
              <td>{c.natureOfDisability}</td>
              <td>{c.causeOfDisability || "—"}</td>
              <td>{c.assistiveDevices || "—"}</td>
              <td>{c.jobType || "—"}</td>
              <td>{c.sourceOfIncome || "—"}</td>
              <td>{formatAddress(c.presentAddress)}</td>
              <td>{formatAddress(c.permanentAddress)}</td>
              <td>
                <span className={`badge ${c.status}`}>{c.status}</span>
              </td>
              <td>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link
                    href={`/kdf/${encodeURIComponent(c.cnic)}/view`}
                    className="btn ghost"
                    style={{ padding: "4px 10px", fontSize: 12, textDecoration: "none" }}
                  >
                    View
                  </Link>
                  {showEdit && (
                    <Link
                      href={`/kdf/${encodeURIComponent(c.cnic)}`}
                      className="btn ghost"
                      style={{ padding: "4px 10px", fontSize: 12, textDecoration: "none" }}
                    >
                      Edit
                    </Link>
                  )}
                  {showEdit && <WithdrawButton cnic={c.cnic} />}
                  {!showEdit && c.status === "withdrawn" && <RestoreButton cnic={c.cnic} />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function KdfListPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const created = searchParams?.created;

  await dbConnect();
  const cases = await Case.find({}).sort({ submittedAt: -1 }).lean();

  const referred = cases.filter((c) => c.status === "referred");
  const completed = cases.filter((c) => c.status !== "referred");

  return (
    <>
      <Topbar session={session} label="KDF" />
      <div className="page" style={{ maxWidth: 1400 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 4,
          }}
        >
          <h1 style={{ margin: 0 }}>Cases</h1>
          <Link href="/kdf/new" className="btn" style={{ textDecoration: "none" }}>
            + New Case
          </Link>
        </div>
        {created && (
          <div
            className="error-banner"
            style={{ background: "#e4eee6", color: "var(--green)", borderColor: "#c7ddcb", marginTop: 12 }}
          >
            Case submitted: {created}
          </div>
        )}

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Referred {referred.length ? `(${referred.length})` : ""}</h3>
          <CaseTable cases={referred} showEdit />
        </div>

        <div className="card">
          <h3>Completed {completed.length ? `(${completed.length})` : ""}</h3>
          <CaseTable cases={completed} showEdit={false} />
        </div>
      </div>
    </>
  );
}
