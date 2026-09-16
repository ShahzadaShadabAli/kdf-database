"use client";

import { useState } from "react";
import Link from "next/link";

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

const COUNCIL_NAMES = {
  NCRDP: "NATIONAL COUNCIL FOR THE REHABILITATION OF DISABLED PERSONS",
  PCRDP: "PROVINCIAL COUNCIL FOR THE REHABILITATION OF DISABLED PERSONS",
};

export function DisabilityCertificate({ data }) {
  const [dateStr, setDateStr] = useState(() =>
    toDateInputValue(data.decidedAt ? new Date(data.decidedAt) : new Date())
  );
  const [council, setCouncil] = useState("NCRDP");
  const [specialistName, setSpecialistName] = useState("");

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
          <div className="field" style={{ margin: 0, minWidth: 140 }}>
            <label htmlFor="council">Council</label>
            <select id="council" value={council} onChange={(e) => setCouncil(e.target.value)}>
              <option value="NCRDP">NCRDP</option>
              <option value="PCRDP">PCRDP</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0, minWidth: 200 }}>
            <label htmlFor="specialistName">Specialist name (Member)</label>
            <input
              id="specialistName"
              value={specialistName}
              onChange={(e) => setSpecialistName(e.target.value)}
              placeholder="e.g. Dr. Nasir Hussain"
            />
          </div>
          <button className="btn" onClick={() => window.print()} type="button">
            Print
          </button>
        </div>
      </div>

      <div className="dcert">
        <div className="dcert-watermark">{council}</div>
        <div className="dcert-body">
          <div className="head">
            <p>GOVERNMENT OF GILGIT-BALTISTAN</p>
            <p className="dept">
              SOCIAL WELFARE, POPULATION WELFARE, WOMEN DEVELOPMENT, HUMAN/CHILD RIGHTS AND YOUTH AFFAIRS
            </p>
            <p>({COUNCIL_NAMES[council]})</p>
          </div>
          <div className="head-rule">* * * * * * * * * * * * *</div>

          <div className="topline">
            <span>
              Dated: <span className="fval">{dd}-{mm}-{yyyy}</span>
            </span>
            <span>
              Reg. No: <span className="fval">{data.certificateNo}</span>-{council}
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
            <div className="ffield">
              <span className="flabel">8. Nature of Disability:</span>
              <span className="fval">
                {data.disabilityType}
                {data.disabilityType && data.natureOfDisability ? ". " : ""}
                {data.natureOfDisability && `(${data.natureOfDisability}).`}
              </span>
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

          <div className="dcert-sign-row">
            <div className="sig-col">
              <div className="board-line">(i) *Fit for work. <span className="fval">&nbsp;</span></div>
              <div className="sig">
                <div className="sig-name">&nbsp;</div>
                <div className="cap">Social Welfare Officer/Member {council}</div>
                <div>RHQ Hospital Skardu</div>
              </div>
            </div>
            <div className="sig-col">
              <div className="board-line">(ii) <span className="fval">&nbsp;</span></div>
              <div className="sig">
                <div className="sig-name">{specialistName || " "}</div>
                <div className="cap">Consultant Orthopedic &amp; Spine/Member {council}</div>
                <div>RHQ Hospital Skardu</div>
              </div>
            </div>
          </div>

          <div className="dcert-chairman">
            <div className="sig-name">&nbsp;</div>
            <div className="cap">Deputy Medical Superintendent (Chairman)</div>
            <div>{council} RHQ Hospital Skardu</div>
          </div>
        </div>
      </div>
    </>
  );
}
