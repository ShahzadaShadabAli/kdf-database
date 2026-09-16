"use client";

import { useState } from "react";

function formatAddress(addr) {
  if (!addr) return "";
  return `UC ${addr.uc}, Tehsil ${addr.tehsil}, District ${addr.district}`;
}

// The literal four options printed on the government form's field 8 — kept
// distinct from the app's own (renamed, expanded) disabilityType options,
// since this text replicates the paper form exactly.
const DISABILITY_CHOICES = ["Physically", "Visually", "Hearing", "Mentally"];

export function ApplicationForm({ data }) {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  const [disabilityChoice, setDisabilityChoice] = useState(() =>
    DISABILITY_CHOICES.includes(data.disabilityType) ? data.disabilityType : null
  );
  const [specialist, setSpecialist] = useState("");

  return (
    <>
      <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn" onClick={() => window.print()} type="button">
          Print
        </button>
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
            Reg. No: <span className="fval">{data.certificateNo}</span>/NCRDP
          </span>
        </div>

        <div className="title">APPLICATION FOR DISABILITY CERTIFICATE/SUPPORTIVE AID.</div>

        <div className="frow">
          <div className="ffield">
            <span className="flabel">1. Name:</span>
            <span className="fval">{data.name}</span>
          </div>
          <div className="ffield">
            <span className="flabel">2. S/D/W/O:</span>
            <span className="fval">{data.sonOf}</span>
          </div>
        </div>

        <div className="frow">
          <div className="ffield">
            <span className="flabel">3. Marital Status:</span>
            <span className="fval">{data.maritalStatus}</span>
          </div>
          <div className="ffield">
            <span className="flabel">4. Spouse:</span>
            <span className="fval">{data.spouse}</span>
          </div>
        </div>

        <div className="frow">
          <div className="ffield">
            <span className="flabel">5. Date of birth:</span>
            <span className="fval">{new Date(data.dob).toLocaleDateString()}</span>
          </div>
          <div className="ffield">
            <span className="flabel">6. CNIC:</span>
            <span className="fval">{data.cnic}</span>
          </div>
        </div>

        <div className="frow">
          <div className="ffield">
            <span className="flabel">7. Qualification:</span>
            <span className="fval">{data.qualification}</span>
          </div>
          <div className="ffield" />
        </div>

        <div className="frow">
          <div className="ffield full">
            <span className="flabel">8. Type of Disability:</span>
            <span className="fval disability-choices" style={{ borderBottom: "none" }}>
              {DISABILITY_CHOICES.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="disability-choice"
                  onClick={() => setDisabilityChoice(opt)}
                >
                  <span className="check-box">{disabilityChoice === opt ? "☑" : "☐"}</span> {opt}
                </button>
              ))}
            </span>
          </div>
        </div>

        <div className="frow">
          <div className="ffield">
            <span className="flabel">9. Nature of Disability:</span>
            <span className="fval">{data.natureOfDisability}</span>
          </div>
          <div className="ffield">
            <span className="flabel">10. Cause of disability:</span>
            <span className="fval">{data.causeOfDisability}</span>
          </div>
        </div>

        <div className="frow">
          <div className="ffield">
            <span className="flabel">11. Type of Job can do:</span>
            <span className="fval">{data.jobType}</span>
          </div>
          <div className="ffield">
            <span className="flabel">12. Source of income:</span>
            <span className="fval">{data.sourceOfIncome}</span>
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
            <span className="fval">{data.phone}</span>
          </div>
        </div>

        <div className="frow">
          <div className="ffield full">
            <span className="flabel">15. Present Address:</span>
            <span className="fval">{formatAddress(data.presentAddress)}</span>
          </div>
        </div>

        <div className="frow">
          <div className="ffield full">
            <span className="flabel">16. Permanent Address:</span>
            <span className="fval">{formatAddress(data.permanentAddress)}</span>
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
            <div className="cap">Member</div>(
            <input
              value={specialist}
              onChange={(e) => setSpecialist(e.target.value)}
              placeholder="name / specialty"
              className="inline-fill"
            />
            / Specialist.)
          </div>
        </div>

        <div className="chairman">
          <div className="cap">Chairman</div>
          Assessment board NCRDP/
          <br />
          Medical Superintendent RHQ Hospital Skardu
        </div>
      </div>
    </>
  );
}
