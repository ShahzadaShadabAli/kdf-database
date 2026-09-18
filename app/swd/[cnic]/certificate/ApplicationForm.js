"use client";

import { useEffect, useRef, useState } from "react";
import { formatDob } from "@/lib/dob";
import { relationName } from "@/lib/caseOptions";

function formatAddress(addr) {
  if (!addr) return "";
  return `UC ${addr.uc}, Tehsil ${addr.tehsil}, District ${addr.district}`;
}

// The literal four options printed on the government form's field 8 — kept
// distinct from the app's own (renamed, expanded) disabilityType options,
// since this text replicates the paper form exactly.
const DISABILITY_CHOICES = ["Physically", "Visually", "Hearing", "Mentally"];

// Which printed box(es) the type KDF recorded corresponds to. "Multiple
// Disabilities" maps to none: Social Welfare ticks each one that applies.
const TYPE_TO_CHOICES = {
  Physically: ["Physically"],
  Visually: ["Visually"],
  Hearing: ["Hearing"],
  "Hearing and Speech": ["Hearing"],
  Mentally: ["Mentally"],
  "Mentally Retarded": ["Mentally"],
};

// The entries the form's note ("Please filled S. No. 9,10,11, 17,18,19,20
// and 21") leaves to Social Welfare. They're asked for in a pop-up each time
// the form is printed.
const NOTE_FIELDS = [
  "natureOfDisability",
  "causeOfDisability",
  "jobType",
  "disabledStatus",
  "impairment",
  "fitness",
  "category",
];

const BLANK = " ";
const TICK = "✓";

export function ApplicationForm({ data }) {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  const isVerified = data.status === "verified";

  const [checks, setChecks] = useState(() => data.disabilityChecks ?? TYPE_TO_CHOICES[data.disabilityType] ?? []);
  const [specialist, setSpecialist] = useState("");

  // `values` is what's printed; `draft` is what's in the pop-up until saved.
  const [values, setValues] = useState(() => Object.fromEntries(NOTE_FIELDS.map((f) => [f, data[f] || ""])));
  const [draft, setDraft] = useState(values);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [printPending, setPrintPending] = useState(false);
  const dialogRef = useRef(null);

  // Print only after the saved values have rendered into the form.
  useEffect(() => {
    if (!printPending) return;
    setPrintPending(false);
    window.print();
  }, [printPending]);

  function toggleCheck(opt) {
    setChecks((current) => (current.includes(opt) ? current.filter((c) => c !== opt) : [...current, opt]));
  }

  function openPrintDialog() {
    setDraft(values);
    setError("");
    dialogRef.current?.showModal();
  }

  function setDraftField(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  async function saveAndPrint(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(data.cnic)}/assessment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, disabilityChecks: DISABILITY_CHOICES.filter((c) => checks.includes(c)) }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Could not save these entries.");
        return;
      }
      const { disabilityChecks, ...saved } = body;
      setValues(saved);
      setChecks(disabilityChecks);
      dialogRef.current?.close();
      setPrintPending(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="no-print form-toolbar">
        <span className="hint">
          Tick field 8 directly on the form — more than one box can be ticked. Entries 9–11 and 17–21 are asked for
          when you print.
        </span>
        <button className="btn" onClick={openPrintDialog} type="button">
          Print
        </button>
      </div>

      <dialog ref={dialogRef} className="assess-dialog no-print" aria-labelledby="assess-title">
        <form onSubmit={saveAndPrint}>
          <h3 id="assess-title">Before printing</h3>
          <p className="assess-lede">
            The form&apos;s note asks for S. No. 9, 10, 11 and 17–21. They&apos;re saved to this case, so the next print
            starts from them. Anything left blank prints as an empty line to fill in by hand
            {isVerified ? ", except 9 and 19–20, which a verified case must keep" : ""}.
          </p>

          <div className="subhead">Applicant</div>
          <div className="grid">
            <div className="field full">
              <label htmlFor="af-nature">9. Nature of disability</label>
              <input
                id="af-nature"
                value={draft.natureOfDisability}
                onChange={(e) => setDraftField("natureOfDisability", e.target.value)}
                placeholder="e.g. Kyphoscoliosis"
                required={isVerified}
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="af-cause">10. Cause of disability</label>
              <input
                id="af-cause"
                value={draft.causeOfDisability}
                onChange={(e) => setDraftField("causeOfDisability", e.target.value)}
                placeholder="e.g. by birth, accident, disease"
              />
            </div>
            <div className="field">
              <label htmlFor="af-job">11. Type of job can do</label>
              <input id="af-job" value={draft.jobType} onChange={(e) => setDraftField("jobType", e.target.value)} />
            </div>
          </div>

          <div className="subhead">Recommendation of assessment board</div>
          <div className="grid">
            <div className="field">
              <label htmlFor="af-disabled">17. Disabled / not disabled</label>
              <select
                id="af-disabled"
                value={draft.disabledStatus}
                onChange={(e) => setDraftField("disabledStatus", e.target.value)}
              >
                <option value="">Leave blank</option>
                <option value="Disabled">Disabled</option>
                <option value="Not Disabled">Not Disabled</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="af-impairment">18. Disability / impairment</label>
              <input
                id="af-impairment"
                value={draft.impairment}
                onChange={(e) => setDraftField("impairment", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="af-fitness">19–20. Fit for work</label>
              <select
                id="af-fitness"
                value={draft.fitness}
                onChange={(e) => setDraftField("fitness", e.target.value)}
                required={isVerified}
              >
                <option value="">{isVerified ? "Choose…" : "Leave blank"}</option>
                <option value="Fit">Fit for work (19)</option>
                <option value="Unfit">Not fit for work (20)</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="af-category">21. Category</label>
              <select id="af-category" value={draft.category} onChange={(e) => setDraftField("category", e.target.value)}>
                <option value="">Leave blank</option>
                <option value="A">(i) A</option>
                <option value="B">(ii) B</option>
                <option value="C">(iii) C</option>
              </select>
            </div>
          </div>

          {error && <div className="field-error">{error}</div>}

          <div className="assess-actions">
            <button type="button" className="btn ghost" onClick={() => dialogRef.current?.close()} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Saving…" : "Save and print"}
            </button>
          </div>
        </form>
      </dialog>

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
            <span className="fval">{relationName(data)}</span>
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
            <span className="fval">{formatDob(data.dob, data.dobYearOnly)}</span>
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
              {DISABILITY_CHOICES.map((opt) => {
                const checked = checks.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    className="disability-choice"
                    onClick={() => toggleCheck(opt)}
                  >
                    <span className="check-box">{checked ? "☑" : "☐"}</span> {opt}
                  </button>
                );
              })}
            </span>
          </div>
        </div>

        <div className="frow">
          <div className="ffield">
            <span className="flabel">9. Nature of Disability:</span>
            <span className="fval">{values.natureOfDisability}</span>
          </div>
          <div className="ffield">
            <span className="flabel">10. Cause of disability:</span>
            <span className="fval">{values.causeOfDisability}</span>
          </div>
        </div>

        <div className="frow">
          <div className="ffield">
            <span className="flabel">11. Type of Job can do:</span>
            <span className="fval">{values.jobType}</span>
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
            <span className="fval">{values.disabledStatus || BLANK}</span>
          </div>
          <div className="ffield">
            <span className="flabel">18. Disability/Impairment:</span>
            <span className="fval">{values.impairment || BLANK}</span>
          </div>
        </div>

        <div className="frow board-row">
          <div className="ffield">
            <span className="flabel">19. Fit for Work:</span>
            <span className="fval">{values.fitness === "Fit" ? TICK : BLANK}</span>
          </div>
          <div className="ffield">
            <span className="flabel">20. Not fit for work:</span>
            <span className="fval">{values.fitness === "Unfit" ? TICK : BLANK}</span>
          </div>
        </div>

        <div className="category-row">
          <span>21. Category:-</span>
          <span>
            (i) A <span className="fval">{values.category === "A" ? TICK : BLANK}</span>
          </span>
          <span>
            (ii) B <span className="fval">{values.category === "B" ? TICK : BLANK}</span>
          </span>
          <span>
            (iii) C <span className="fval">{values.category === "C" ? TICK : BLANK}</span>
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
