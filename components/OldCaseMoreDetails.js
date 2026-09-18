import { caseGender, caseMaritalStatus } from "@/lib/caseOptions";

// The new-case details an old case can gain when KDF edits it (its paper
// register entry has none of them). Rendered as rows of a `.detail-grid`.
export function OldCaseMoreDetails({ found }) {
  const permanent = found.permanentAddress;
  return (
    <>
      <div>
        <div className="k">Gender</div>
        <div className="v">{caseGender(found)}</div>
      </div>
      <div>
        <div className="k">Marital Status</div>
        <div className="v">{caseMaritalStatus(found) || "—"}</div>
      </div>
      <div>
        <div className="k">Spouse</div>
        <div className="v">{found.spouse || "—"}</div>
      </div>
      <div>
        <div className="k">Qualification</div>
        <div className="v">{found.qualification || "—"}</div>
      </div>
      <div>
        <div className="k">Email</div>
        <div className="v">{found.email || "—"}</div>
      </div>
      <div>
        <div className="k">Assistive Devices Provided</div>
        <div className="v">{found.assistiveDevices || "—"}</div>
      </div>
      <div>
        <div className="k">Source of Income</div>
        <div className="v">{found.sourceOfIncome || "—"}</div>
      </div>
      <div className="full">
        <div className="k">Permanent Address</div>
        <div className="v">
          {permanent ? `UC ${permanent.uc}, Tehsil ${permanent.tehsil}, District ${permanent.district}` : "—"}
        </div>
      </div>
    </>
  );
}
