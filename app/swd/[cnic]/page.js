import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCase } from "@/lib/db";
import { Topbar } from "@/components/Topbar";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DecisionActions } from "./DecisionActions";
import { CertificateNoForm } from "./CertificateNoForm";

export default async function SwdDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  const cnic = decodeURIComponent(params.cnic);

  const found = await getCase(cnic);
  // A withdrawn case is invisible to Social Welfare, even by direct URL.
  if (!found || found.status === "withdrawn") notFound();

  return (
    <>
      <Topbar session={session} label="Social Welfare" />
      <div className="page">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 4,
          }}
        >
          <h1 style={{ margin: 0 }}>Case Detail</h1>
          <Link href="/swd" className="btn ghost" style={{ textDecoration: "none" }}>
            ← Back to case list
          </Link>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Applicant</span>
            {found.caseType === "old" && <span className="badge withdrawn">old case</span>}
          </h3>
          <div className="detail-grid">
            <div>
              <div className="k">Case No.</div>
              <div className="v mono">{found.caseNo}</div>
            </div>
            <div>
              <div className="k">CNIC</div>
              <div className="v mono">{found.cnic}</div>
            </div>
            <div>
              <div className="k">Name</div>
              <div className="v">{found.name}</div>
            </div>
            {found.caseType === "old" ? (
              <>
                <div>
                  <div className="k">{found.guardianRelation || "S/O"}</div>
                  <div className="v">{found.sonOf}</div>
                </div>
                <div>
                  <div className="k">Type/Nature of Disability</div>
                  <div className="v">{found.natureOfDisability}</div>
                </div>
                <div>
                  <div className="k">Fit / Unfit</div>
                  <div className="v">{found.fitness || "—"}</div>
                </div>
                <div>
                  <div className="k">Date of Birth</div>
                  <div className="v">{new Date(found.dob).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="k">Contact Cell No.</div>
                  <div className="v">{found.phone}</div>
                </div>
                <div>
                  <div className="k">Certificate No.</div>
                  <div className="v">{found.certificateNo || "—"}</div>
                </div>
                <div className="full">
                  <div className="k">Address</div>
                  <div className="v">
                    UC {found.address?.uc}, Tehsil {found.address?.tehsil}, District {found.address?.district}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="k">Gender</div>
                  <div className="v">{found.gender || "—"}</div>
                </div>
                <div>
                  <div className="k">Marital Status</div>
                  <div className="v">{found.maritalStatus}</div>
                </div>
                <div>
                  <div className="k">{found.guardianRelation || "S/O"}</div>
                  <div className="v">{found.sonOf}</div>
                </div>
                <div>
                  <div className="k">Spouse</div>
                  <div className="v">{found.spouse || "—"}</div>
                </div>
                <div>
                  <div className="k">Date of Birth</div>
                  <div className="v">{new Date(found.dob).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="k">Qualification</div>
                  <div className="v">{found.qualification || "—"}</div>
                </div>
                <div>
                  <div className="k">Phone</div>
                  <div className="v">{found.phone}</div>
                </div>
                <div>
                  <div className="k">Email</div>
                  <div className="v">{found.email || "—"}</div>
                </div>
                <div>
                  <div className="k">Type of Disability</div>
                  <div className="v">{found.disabilityType}</div>
                </div>
                <div>
                  <div className="k">Nature of Disability</div>
                  <div className="v">{found.natureOfDisability}</div>
                </div>
                <div>
                  <div className="k">Cause of Disability</div>
                  <div className="v">{found.causeOfDisability || "—"}</div>
                </div>
                <div>
                  <div className="k">Assistive Devices Provided</div>
                  <div className="v">{found.assistiveDevices || "—"}</div>
                </div>
                <div>
                  <div className="k">Type of Job Can Do</div>
                  <div className="v">{found.jobType || "—"}</div>
                </div>
                <div>
                  <div className="k">Source of Income</div>
                  <div className="v">{found.sourceOfIncome || "—"}</div>
                </div>
                <div className="full">
                  <div className="k">Present Address</div>
                  <div className="v">
                    UC {found.presentAddress?.uc}, Tehsil {found.presentAddress?.tehsil}, District{" "}
                    {found.presentAddress?.district}
                  </div>
                </div>
                <div className="full">
                  <div className="k">Permanent Address</div>
                  <div className="v">
                    UC {found.permanentAddress?.uc}, Tehsil {found.permanentAddress?.tehsil}, District{" "}
                    {found.permanentAddress?.district}
                  </div>
                </div>
              </>
            )}
          </div>
          {found.caseType !== "old" && (
            <div style={{ marginBottom: 14 }}>
              <CertificateNoForm cnic={found.cnic} initialValue={found.certificateNo || ""} />
            </div>
          )}
          {found.caseType !== "old" && (
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                href={`/swd/${encodeURIComponent(found.cnic)}/certificate`}
                className="btn ghost"
                style={{ textDecoration: "none" }}
              >
                Print application form
              </Link>
              {found.status === "verified" && (
                <Link
                  href={`/swd/${encodeURIComponent(found.cnic)}/disability-certificate`}
                  className="btn ghost"
                  style={{ textDecoration: "none" }}
                >
                  Print disability certificate
                </Link>
              )}
            </div>
          )}
        </div>

        {found.status === "referred" && (
          <DecisionActions
            cnic={found.cnic}
            initialNatureOfDisability={found.natureOfDisability}
            initialCauseOfDisability={found.causeOfDisability}
            initialJobType={found.jobType}
            initialSourceOfIncome={found.sourceOfIncome}
          />
        )}

        {(found.status === "verified" || found.status === "rejected") && (
          <div className="card">
            <h3>Decision</h3>
            <div className="detail-grid">
              <div>
                <div className="k">Outcome</div>
                <div className="v">
                  <span className={`badge ${found.status}`}>{found.status}</span>
                </div>
              </div>
              <div>
                <div className="k">Decided</div>
                <div className="v">
                  {found.swd?.decidedAt
                    ? new Date(found.swd.decidedAt).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
