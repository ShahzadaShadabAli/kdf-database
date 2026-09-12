"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const OFFICER_NAME_KEY = "kdf-cert-officer-name";

function formatAddress(addr) {
  if (!addr) return "";
  return `${addr.uc}, Tehsil ${addr.tehsil}, District ${addr.district}`;
}

function toDateInputValue(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function DisabilityCertificate({ data }) {
  const [officerName, setOfficerName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [dateStr, setDateStr] = useState(() =>
    toDateInputValue(data.decidedAt ? new Date(data.decidedAt) : new Date())
  );
  const [printError, setPrintError] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(OFFICER_NAME_KEY);
    if (saved) setOfficerName(saved);
  }, []);

  function updateOfficerName(value) {
    setOfficerName(value);
    window.localStorage.setItem(OFFICER_NAME_KEY, value);
  }

  function handlePrint() {
    if (!regNo.trim()) {
      setPrintError("Enter the register number before printing.");
      return;
    }
    setPrintError("");
    window.print();
  }

  const dated = new Date(`${dateStr}T00:00:00`);
  const dd = String(dated.getDate()).padStart(2, "0");
  const mm = String(dated.getMonth() + 1).padStart(2, "0");
  const yyyy = dated.getFullYear();

  return (
    <>
      <div
        className="no-print"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, gap: 16, flexWrap: "wrap" }}
      >
        <Link href={`/swd/${encodeURIComponent(data.cnic)}`} className="btn ghost" style={{ textDecoration: "none" }}>
          ← Back to case
        </Link>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div className="field" style={{ margin: 0, minWidth: 180 }}>
            <label htmlFor="certDate">Date</label>
            <input id="certDate" type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0, minWidth: 160 }}>
            <label htmlFor="regNo">Register No. (required to print)</label>
            <input
              id="regNo"
              value={regNo}
              onChange={(e) => {
                setRegNo(e.target.value);
                if (e.target.value.trim()) setPrintError("");
              }}
              placeholder="e.g. 0843/2014"
            />
          </div>
          <div className="field" style={{ margin: 0, minWidth: 220 }}>
            <label htmlFor="officerName">Social Welfare Officer name (remembered on this device)</label>
            <input
              id="officerName"
              value={officerName}
              onChange={(e) => updateOfficerName(e.target.value)}
              placeholder="e.g. Ghulam Nabi"
            />
          </div>
          <button className="btn" onClick={handlePrint} type="button">
            Print
          </button>
        </div>
      </div>
      {printError && (
        <div className="error-banner no-print" style={{ marginBottom: 16 }}>
          {printError}
        </div>
      )}

      <div className="dcert">
        <div className="dcert-watermark">NCRDP</div>
        <div className="dcert-body">
          <div className="head">
            <p>GOVERNMENT OF PAKISTAN</p>
            <p className="dept">MINISTRY OF SOCIAL WELFARE AND SPECIAL EDUCATION</p>
            <p>(NATIONAL COUNCIL FOR THE REHABILITATION OF DISABLED PERSONS)</p>
          </div>
          <div className="head-rule">* * * * * * * * * * * * *</div>

          <div className="topline">
            <span>
              Dated: <span className="fval">{dd}-{mm}-{yyyy}</span>
            </span>
            <span>
              Reg. No: <span className="fval">{regNo || " "}</span>-NCRDP
            </span>
          </div>

          <div className="dcert-title">
            <div className="big">DISABILITY CERTIFICATE</div>
            <div className="sub">ASSESSMENT BOARD FOR THE DISABLED PERSONS</div>
          </div>

          <div className="frow">
            <div className="ffield">
              <span className="flabel">1. Name:</span>
              <span className="fval">{data.name}</span>
            </div>
            <div className="ffield">
              <span className="flabel">2. S/O:</span>
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
            <div className="ffield">
              <span className="flabel">8. Nature of Disability:</span>
              <span className="fval">{data.natureOfDisability}</span>
            </div>
          </div>

          <div className="frow">
            <div className="ffield full">
              <span className="flabel">9. Present Address:</span>
              <span className="fval">{formatAddress(data.presentAddress)}</span>
            </div>
          </div>

          <div className="frow">
            <div className="ffield full">
              <span className="flabel">10. Permanent Address:</span>
              <span className="fval">{formatAddress(data.permanentAddress)}</span>
            </div>
          </div>

          <div className="board-rec">
            <span className="flabel">11. Recommendation of the Board:</span>
            <div className="board-rec-options">
              <span>(i) <span className="fval">&nbsp;</span></span>
              <span>(ii) *Not fit for work. <span className="fval">&nbsp;</span></span>
            </div>
            <p className="note">*Not applicable — strike out whichever is not applicable.</p>
          </div>

          <div className="dcert-sign-row">
            <div className="sig">
              <div className="sig-name">{officerName || " "}</div>
              <div className="cap">Social Welfare Officer/Member NCRDP</div>
              <div>DHQ Hospital Skardu</div>
            </div>
            <div className="sig">
              <div className="sig-name">&nbsp;</div>
              <div className="cap">Medical Superintendent/Chairman</div>
              <div>Assessment Board NCRDP DHQ Hospital Skardu</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
