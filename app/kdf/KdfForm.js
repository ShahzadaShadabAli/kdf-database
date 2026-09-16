"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CnicInput, CNIC_REGEX } from "@/components/CnicInput";
import { AddressFields } from "@/components/AddressFields";

const EMPTY_ADDRESS = { uc: "", tehsil: "", district: "" };

const EMPTY_NEW_FORM = {
  caseType: "new",
  name: "",
  gender: "Male",
  maritalStatus: "Single",
  guardianRelation: "S/O",
  sonOf: "",
  spouse: "",
  dob: "",
  cnic: "",
  qualification: "",
  phone: "",
  email: "",
  assistiveDevices: "",
  disabilityType: "Physically",
  natureOfDisability: "",
  causeOfDisability: "",
  jobType: "",
  sourceOfIncome: "",
  presentAddress: { ...EMPTY_ADDRESS },
  permanentAddress: { ...EMPTY_ADDRESS },
};

const EMPTY_OLD_FORM = {
  caseType: "old",
  name: "",
  guardianRelation: "S/O",
  sonOf: "",
  natureOfDisability: "",
  fitness: "Fit",
  dob: "",
  cnic: "",
  address: { ...EMPTY_ADDRESS },
  phone: "",
  certificateNo: "",
};

function addressesEqual(a, b) {
  return a.uc === b.uc && a.tehsil === b.tehsil && a.district === b.district;
}

export function KdfForm({ mode = "create", initialData = null }) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(initialData || EMPTY_NEW_FORM);
  // The CNIC this record was fetched under — used to address the API route
  // even if the user edits the CNIC field itself (e.g. fixing a typo).
  const [originalCnic] = useState(initialData?.cnic || null);
  const [sameAsPresent, setSameAsPresent] = useState(
    !!initialData &&
      initialData.caseType !== "old" &&
      addressesEqual(initialData.presentAddress, initialData.permanentAddress)
  );
  const [cnicError, setCnicError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOld = form.caseType === "old";

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function switchCaseType(caseType) {
    setForm(caseType === "old" ? EMPTY_OLD_FORM : EMPTY_NEW_FORM);
    setSameAsPresent(false);
    setCnicError("");
    setError("");
  }

  function updatePresentAddress(value) {
    setForm((f) => ({
      ...f,
      presentAddress: value,
      permanentAddress: sameAsPresent ? value : f.permanentAddress,
    }));
  }

  function toggleSameAsPresent(checked) {
    setSameAsPresent(checked);
    if (checked) {
      setForm((f) => ({ ...f, permanentAddress: f.presentAddress }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCnicError("");

    if (!CNIC_REGEX.test(form.cnic)) {
      setCnicError("CNIC must be in the form 00000-0000000-0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/cases/${encodeURIComponent(originalCnic)}` : "/api/cases",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not save case.");
        return;
      }

      router.push(isEdit ? "/kdf" : `/kdf?created=${encodeURIComponent(data.caseNo)}`);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          paddingBottom: 8,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <h3 style={{ margin: 0, padding: 0, border: "none" }}>
          {isEdit ? "Edit Case — Applicant Details" : isOld ? "Old Case — Applicant Details" : "New Case — Applicant Details"}
        </h3>
        {!isEdit && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className={isOld ? "btn ghost" : "btn"}
              style={{ padding: "5px 12px", fontSize: 12 }}
              onClick={() => switchCaseType("new")}
            >
              New Case
            </button>
            <button
              type="button"
              className={isOld ? "btn" : "btn ghost"}
              style={{ padding: "5px 12px", fontSize: 12 }}
              onClick={() => switchCaseType("old")}
            >
              Old Case
            </button>
          </div>
        )}
      </div>

      {isOld && !isEdit && (
        <p style={{ color: "var(--ink-soft)", fontSize: 12.5, margin: "0 0 16px" }}>
          For a pre-existing paper record being entered into the system. This case is recorded as
          already verified — it does not go through Social Welfare's referral queue.
        </p>
      )}

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        {isOld ? (
          <>
          <div className="grid">
            <div className="field">
              <label>Name of Disabled Person</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div className="field">
              <label>Relation</label>
              <select
                value={form.guardianRelation}
                onChange={(e) => update("guardianRelation", e.target.value)}
              >
                <option value="S/O">S/O (Son of)</option>
                <option value="D/O">D/O (Daughter of)</option>
              </select>
            </div>
            <div className="field">
              <label>Father's Name</label>
              <input value={form.sonOf} onChange={(e) => update("sonOf", e.target.value)} required />
            </div>
            <div className="field">
              <label>Type/Nature of Disability</label>
              <input
                value={form.natureOfDisability}
                onChange={(e) => update("natureOfDisability", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Fit / Unfit</label>
              <select value={form.fitness} onChange={(e) => update("fitness", e.target.value)}>
                <option value="Fit">Fit</option>
                <option value="Unfit">Unfit</option>
              </select>
            </div>
            <div className="field">
              <label>Date of Birth</label>
              <input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} required />
            </div>
            <div className="field">
              <label>CNIC</label>
              <CnicInput value={form.cnic} onChange={(v) => update("cnic", v)} required />
              {cnicError && <div className="field-error">{cnicError}</div>}
            </div>
            <div className="field">
              <label>Contact Cell No.</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="03xx-xxxxxxx"
                required
              />
            </div>
            <div className="field">
              <label>Certificate No.</label>
              <input
                value={form.certificateNo}
                onChange={(e) => update("certificateNo", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="subhead" style={{ marginTop: 16 }}>Address</div>
          <AddressFields value={form.address} onChange={(v) => update("address", v)} />
          </>
        ) : (
          <>
            <div className="grid">
              <div className="field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div className="field">
                <label>Gender</label>
                <select value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Marital Status</label>
                <select value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)}>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Divorced</option>
                  <option>Widowed</option>
                </select>
              </div>
              <div className="field">
                <label>Relation</label>
                <select
                  value={form.guardianRelation}
                  onChange={(e) => update("guardianRelation", e.target.value)}
                >
                  <option value="S/O">S/O (Son of)</option>
                  <option value="D/O">D/O (Daughter of)</option>
                </select>
              </div>
              <div className="field">
                <label>Son / Daughter of</label>
                <input value={form.sonOf} onChange={(e) => update("sonOf", e.target.value)} required />
              </div>
              <div className="field">
                <label>Spouse (if applicable)</label>
                <input
                  value={form.spouse}
                  onChange={(e) => update("spouse", e.target.value)}
                  placeholder="Leave blank if not married"
                />
              </div>
              <div className="field">
                <label>Date of Birth</label>
                <input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} required />
              </div>
              <div className="field">
                <label>CNIC</label>
                <CnicInput value={form.cnic} onChange={(v) => update("cnic", v)} required />
                {cnicError && <div className="field-error">{cnicError}</div>}
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="03xx-xxxxxxx"
                  required
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="field">
                <label>Qualification</label>
                <input value={form.qualification} onChange={(e) => update("qualification", e.target.value)} />
              </div>
              <div className="field">
                <label>Assistive Devices Provided</label>
                <input
                  value={form.assistiveDevices}
                  onChange={(e) => update("assistiveDevices", e.target.value)}
                  placeholder="e.g. wheelchair — leave blank if none"
                />
              </div>
              <div className="field">
                <label>Type of Disability</label>
                <select value={form.disabilityType} onChange={(e) => update("disabilityType", e.target.value)}>
                  <option value="Physically">Physically</option>
                  <option value="Visually">Visually</option>
                  <option value="Hearing and Speech">Hearing and Speech</option>
                  <option value="Mentally Retarded">Mentally Retarded</option>
                  <option value="Multiple Disabilities">Multiple Disabilities</option>
                  {(form.disabilityType === "Hearing" || form.disabilityType === "Mentally") && (
                    <option value={form.disabilityType}>{form.disabilityType} (legacy — pick a current option)</option>
                  )}
                </select>
              </div>
              <div className="field">
                <label>Nature of Disability</label>
                <input
                  value={form.natureOfDisability}
                  onChange={(e) => update("natureOfDisability", e.target.value)}
                  placeholder="Left for Social Welfare to fill in once assessed"
                />
              </div>
              <div className="field">
                <label>Cause of Disability</label>
                <input
                  value={form.causeOfDisability}
                  onChange={(e) => update("causeOfDisability", e.target.value)}
                  placeholder="e.g. by birth, accident, disease"
                />
              </div>
              <div className="field">
                <label>Type of Job Can Do</label>
                <input value={form.jobType} onChange={(e) => update("jobType", e.target.value)} />
              </div>
              <div className="field">
                <label>Source of Income</label>
                <input
                  value={form.sourceOfIncome}
                  onChange={(e) => update("sourceOfIncome", e.target.value)}
                />
              </div>
            </div>

            <div className="subhead">Present Address</div>
            <AddressFields value={form.presentAddress} onChange={updatePresentAddress} />

            <div className="subhead" style={{ marginTop: 16 }}>Permanent Address</div>
            <div className="checkbox-row">
              <input
                type="checkbox"
                id="sameAsPresent"
                checked={sameAsPresent}
                onChange={(e) => toggleSameAsPresent(e.target.checked)}
              />
              <label htmlFor="sameAsPresent">Same as present address</label>
            </div>
            <AddressFields
              value={form.permanentAddress}
              onChange={(v) => update("permanentAddress", v)}
              disabled={sameAsPresent}
            />
          </>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Link href="/kdf" className="btn ghost" style={{ textDecoration: "none" }}>
            Cancel
          </Link>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting
              ? isEdit
                ? "Saving…"
                : "Submitting…"
              : isEdit
              ? "Save changes"
              : isOld
              ? "Save old case as verified"
              : "Submit case for Social Welfare"}
          </button>
        </div>
      </form>
    </div>
  );
}
