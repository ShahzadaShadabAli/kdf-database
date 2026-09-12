import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/models/Case";
import { Topbar } from "@/components/Topbar";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "./PrintButton";

function formatAddress(addr) {
  if (!addr) return "";
  return `UC ${addr.uc}, Tehsil ${addr.tehsil}, District ${addr.district}`;
}

export default async function CertificatePage({ params }) {
  const session = await getServerSession(authOptions);
  const cnic = decodeURIComponent(params.cnic);

  await dbConnect();
  const found = await Case.findOne({ cnic }).lean();
  if (!found || found.status === "withdrawn") notFound();

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

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
          <PrintButton />
        </div>

        <div className="gform">
          <div className="head">
            <p>Government of Gilgit-Baltistan</p>
            <p className="dept">Social Welfare Department Gilgit-Baltistan</p>
            <p>National Council for the Rehabilitation of Disabled Person</p>
            <p className="centre">SOCIAL SERVICES MEDICAL CENTRE (SSMC) RHQ HOSPITAL SKARDU</p>
          </div>
          <div className="head-rule">* * * * * * * * * * * * *</div>

          <div className="topline">
            <span>
              Date: <span className="fval">{dd} / {mm} / {yyyy}</span>
            </span>
            <span>
              Reg. No: <span className="fval">&nbsp;</span>/NCRDP
            </span>
          </div>

          <div className="title">APPLICATION FOR DISABILITY CERTIFICATE/SUPPORTIVE AID.</div>

          <div className="frow">
            <div className="ffield">
              <span className="flabel">1. Name:</span>
              <span className="fval">{found.name}</span>
            </div>
            <div className="ffield">
              <span className="flabel">2. S/D/W/O:</span>
              <span className="fval">{found.sonOf}</span>
            </div>
          </div>

          <div className="frow">
            <div className="ffield">
              <span className="flabel">3. Marital Status:</span>
              <span className="fval">{found.maritalStatus}</span>
            </div>
            <div className="ffield">
              <span className="flabel">4. Spouse:</span>
              <span className="fval">{found.spouse || ""}</span>
            </div>
          </div>

          <div className="frow">
            <div className="ffield">
              <span className="flabel">5. Date of birth:</span>
              <span className="fval">{new Date(found.dob).toLocaleDateString()}</span>
            </div>
            <div className="ffield">
              <span className="flabel">6. CNIC:</span>
              <span className="fval">{found.cnic}</span>
            </div>
          </div>

          <div className="frow">
            <div className="ffield">
              <span className="flabel">7. Qualification:</span>
              <span className="fval">{found.qualification || ""}</span>
            </div>
            <div className="ffield" />
          </div>

          <div className="frow">
            <div className="ffield full">
              <span className="flabel">8. Type of Disability :( Physically /visually /hearing /mentally):</span>
              <span className="fval">{found.disabilityType}</span>
            </div>
          </div>

          <div className="frow">
            <div className="ffield">
              <span className="flabel">9. Nature of Disability:</span>
              <span className="fval">{found.natureOfDisability}</span>
            </div>
            <div className="ffield">
              <span className="flabel">10. Cause of disability:</span>
              <span className="fval">{found.causeOfDisability || ""}</span>
            </div>
          </div>

          <div className="frow">
            <div className="ffield">
              <span className="flabel">11. Type of Job can do:</span>
              <span className="fval">{found.jobType || ""}</span>
            </div>
            <div className="ffield">
              <span className="flabel">12. Source of income:</span>
              <span className="fval">{found.sourceOfIncome || ""}</span>
            </div>
          </div>

          <div className="frow">
            <div className="ffield">
              <span className="flabel">13. Applied for:</span>
              <span className="fval" style={{ borderBottom: "none", fontWeight: 600 }}>
                Disability Certificate
              </span>
            </div>
            <div className="ffield">
              <span className="flabel">14. Phone NO:</span>
              <span className="fval">{found.phone}</span>
            </div>
          </div>

          <div className="frow">
            <div className="ffield full">
              <span className="flabel">15. Present Address:</span>
              <span className="fval">{formatAddress(found.presentAddress)}</span>
            </div>
          </div>

          <div className="frow">
            <div className="ffield full">
              <span className="flabel">16. Permanent Address:</span>
              <span className="fval">{formatAddress(found.permanentAddress)}</span>
            </div>
          </div>

          <div className="applicant-sign-row">
            <div className="sig">Social Welfare Officer (NCRDP)</div>
            <div className="sig">Signature of Applicant</div>
          </div>

          <div className="board-title">Recommendation of Assessment Board</div>

          <div className="declared">Applicant is declared</div>

          <div className="frow board-row">
            <div className="ffield">
              <span className="flabel">17. Disabled/ Not Disabled:</span>
              <span className="fval">&nbsp;</span>
            </div>
            <div className="ffield">
              <span className="flabel">18. Disability/Impairment:</span>
              <span className="fval">&nbsp;</span>
            </div>
          </div>

          <div className="frow board-row">
            <div className="ffield">
              <span className="flabel">19. Fit for Work:</span>
              <span className="fval">&nbsp;</span>
            </div>
            <div className="ffield">
              <span className="flabel">20. Not fit for work:</span>
              <span className="fval">&nbsp;</span>
            </div>
          </div>

          <div className="category-row">
            <span>21. Category:-</span>
            <span>
              (i) A <span className="fval">&nbsp;</span>
            </span>
            <span>
              (ii) B <span className="fval">&nbsp;</span>
            </span>
            <span>
              (iii) C <span className="fval">&nbsp;</span>
            </span>
          </div>

          <p className="note">Note:- Please filled S. No. 9,10,11, 17,18,19 ,20 and 21.</p>

          <div className="board-sign-row">
            <div className="sig">
              <div className="cap">Member</div>
              Social Welfare Officer
            </div>
            <div className="sig">
              <div className="cap">Member</div>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / Specialist.)
            </div>
          </div>

          <div className="chairman">
            <div className="cap">Chairman</div>
            Assessment board NCRDP/
            <br />
            Medical Superintendent RHQ Hospital Skardu
          </div>
        </div>
      </div>
    </>
  );
}
