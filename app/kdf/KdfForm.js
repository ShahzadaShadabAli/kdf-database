"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CnicInput, CNIC_REGEX } from "@/components/CnicInput";
import { AddressFields } from "@/components/AddressFields";
import { DISABILITY_TYPES, RELATIONS, genderForRelation } from "@/lib/caseOptions";

const EMPTY_ADDRESS = { uc: "", tehsil: "", district: "" };

const EMPTY_NEW_FORM = {
  caseType: "new",
  name: "",
  maritalStatus: "Single",
  guardianRelation: "S/O",
  sonOf: "",
  spouse: "",
  dob: "",
  dobYearOnly: false,
  dobYear: "",
  cnic: "",
  qualification: "",
  phone: "",
  email: "",
  assistiveDevices: "",
  disabilityType: "Physically",
  sourceOfIncome: "",
  presentAddress: { ...EMPTY_ADDRESS },
  permanentAddress: { ...EMPTY_ADDRESS },
};

const EMPTY_OLD_FORM = {
  caseType: "old",
  name: "",
  guardianRelation: "S/O",
  sonOf: "",
  spouse: "",
  disabilityType: "Physically",
  natureOfDisability: "",
  fitness: "Fit",
  dob: "",
  dobYearOnly: false,
  dobYear: "",
  cnic: "",
  address: { ...EMPTY_ADDRESS },
  phone: "",
  certificateNo: "",
};

// Older CNICs sometimes carry only a birth year, so the date of birth can
// be switched to a year-only entry. It's sent as 1 January of that year with
// `dobYearOnly: true`; the typed year lives in `dobYear` meanwhile, so
// switching back restores whatever full date was there before.
function DobField({ form, update, setForm }) {
  function toggleYearOnly(yearOnly) {
    setForm((f) => ({
      ...f,
      dobYearOnly: yearOnly,
      dobYear: yearOnly && !f.dobYear ? f.dob.slice(0, 4) : f.dobYear,
    }));
  }

  return (
    <div className="field">
      <div className="label-row">
        <label htmlFor="dob">{form.dobYearOnly ? "Year of Birth" : "Date of Birth"}</label>
        <label className="inline-check">
          <input type="checkbox" checked={!!form.dobYearOnly} onChange={(e) => toggleYearOnly(e.target.checked)} />
          Year only
        </label>
      </div>
      {form.dobYearOnly ? (
        <input
          id="dob"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4}"
          title="Enter the 4-digit year, e.g. 1950"
          placeholder="e.g. 1950"
          value={form.dobYear || ""}
          onChange={(e) => update("dobYear", e.target.value.replace(/\D/g, "").slice(0, 4))}
          required
        />
      ) : (
        <input id="dob" type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} required />
      )}
    </div>
  );
}

// Relation plus the name that follows it. S/O and D/O take the father's
// name; W/O ("wife of") takes the husband's, which is saved as the spouse.
function RelationFields({ form, update, setRelation }) {
  const isWife = form.guardianRelation === "W/O";
  const nameField = isWife ? "spouse" : "sonOf";
  return (
    <>
      <div className="field">
        <label htmlFor="relation">Relation</label>
        <select id="relation" value={form.guardianRelation} onChange={(e) => setRelation(e.target.value)}>
          {RELATIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="relation-name">{isWife ? "Husband's Name" : "Father's Name"}</label>
        <input
          id="relation-name"
          value={form[nameField] || ""}
          onChange={(e) => update(nameField, e.target.value)}
          required
        />
      </div>
    </>
  );
}

function DisabilityTypeField({ form, update }) {
  const isLegacy = form.disabilityType && !DISABILITY_TYPES.includes(form.disabilityType);
  return (
    <div className="field">
      <label htmlFor="disability-type">Type of Disability</label>
      <select
        id="disability-type"
        value={form.disabilityType}
        onChange={(e) => update("disabilityType", e.target.value)}
        required
      >
        {!form.disabilityType && (
          <option value="" disabled>
            Choose a type…
          </option>
        )}
        {DISABILITY_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
        {isLegacy && <option value={form.disabilityType}>{form.disabilityType} (legacy — pick a current option)</option>}
      </select>
    </div>
  );
}

// Gender isn't chosen: it follows the relation (S/O male, D/O and W/O female).
function GenderField({ form }) {
  return (
    <div className="field">
      <div className="label-row">
        <label htmlFor="gender">Gender</label>
        <span className="label-note">set by {form.guardianRelation}</span>
      </div>
      <input id="gender" className="derived" value={genderForRelation(form.guardianRelation)} readOnly tabIndex={-1} />
    </div>
  );
}

// `allowBlank` is for old cases, whose paper record may not say. A W/O
// applicant is a wife, so "Single" (and leaving it blank) is off the table.
function MaritalStatusField({ form, update, allowBlank = false }) {
  const isWife = form.guardianRelation === "W/O";
  return (
    <div className="field">
      <label htmlFor="marital-status">Marital Status</label>
      <select id="marital-status" value={form.maritalStatus || ""} onChange={(e) => update("maritalStatus", e.target.value)}>
        {allowBlank && (
          <option value="" disabled={isWife}>
            Not recorded
          </option>
        )}
        <option value="Single" disabled={isWife}>
          Single
        </option>
        <option value="Married">Married</option>
        <option value="Divorced">Divorced</option>
        <option value="Widowed">Widowed</option>
      </select>
    </div>
  );
}

function addressesEqual(a, b) {
  return a.uc === b.uc && a.tehsil === b.tehsil && a.district === b.district;
}

function hasAnyAddress(addr) {
  return !!addr && [addr.uc, addr.tehsil, addr.district].some((v) => v && v.trim());
}

export function KdfForm({ mode = "create", initialData = null }) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(initialData || EMPTY_NEW_FORM);
  // The CNIC this record was fetched under — used to address the API route
  // even if the user edits the CNIC field itself (e.g. fixing a typo).
  const [originalCnic] = useState(initialData?.cnic || null);
  const [sameAsPresent, setSameAsPresent] = useState(() => {
    if (!initialData) return false;
    // An old case's single address plays the part of the present address.
    if (initialData.caseType === "old") {
      return (
        hasAnyAddress(initialData.permanentAddress) &&
        addressesEqual(initialData.address, initialData.permanentAddress)
      );
    }
    return addressesEqual(initialData.presentAddress, initialData.permanentAddress);
  });
  const [cnicError, setCnicError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOld = form.caseType === "old";

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setRelation(relation) {
    setForm((f) => ({
      ...f,
      guardianRelation: relation,
      // A wife is married: move marital status off "Single" (or, on an old
      // case's edit form, off "Not recorded"). The old-case entry form has no
      // marital field, so nothing is set behind KDF's back there.
      ...(relation === "W/O" && (f.maritalStatus === "Single" || (isEdit && f.caseType === "old" && !f.maritalStatus))
        ? { maritalStatus: "Married" }
        : {}),
    }));
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
      [f.caseType === "old" ? "address" : "presentAddress"]: value,
      permanentAddress: sameAsPresent ? value : f.permanentAddress,
    }));
  }

  function toggleSameAsPresent(checked) {
    setSameAsPresent(checked);
    if (checked) {
      setForm((f) => ({ ...f, permanentAddress: f.caseType === "old" ? f.address : f.presentAddress }));
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

    const { dobYear, ...rest } = form;
    if (form.dobYearOnly) {
      const year = Number(dobYear);
      if (!/^\d{4}$/.test(dobYear) || year < 1900 || year > new Date().getFullYear()) {
        setError(`Year of birth must be a 4-digit year between 1900 and ${new Date().getFullYear()}.`);
        return;
      }
    }
    const payload = {
      ...rest,
      dob: form.dobYearOnly ? `${dobYear}-01-01` : form.dob,
      dobYearOnly: !!form.dobYearOnly,
    };
    if (payload.caseType === "old" && !hasAnyAddress(payload.permanentAddress)) {
      delete payload.permanentAddress;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/cases/${encodeURIComponent(originalCnic)}` : "/api/cases",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
          {isEdit
            ? isOld
              ? "Edit Old Case — Applicant Details"
              : "Edit Case — Applicant Details"
            : isOld
            ? "Old Case — Applicant Details"
            : "New Case — Applicant Details"}
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
            <RelationFields form={form} update={update} setRelation={setRelation} />
            <DisabilityTypeField form={form} update={update} />
            <div className="field">
              <label>Nature of Disability</label>
              <input
                value={form.natureOfDisability}
                onChange={(e) => update("natureOfDisability", e.target.value)}
                placeholder="as written on the certificate, e.g. Kyphoscoliosis"
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
            <DobField form={form} update={update} setForm={setForm} />
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
          <AddressFields value={form.address} onChange={updatePresentAddress} />

          {isEdit && (
            <>
              <div className="subhead" style={{ marginTop: 16 }}>More Details</div>
              <p style={{ color: "var(--ink-soft)", fontSize: 12.5, margin: "0 0 12px" }}>
                The same details a new case records. The paper register doesn&apos;t have them, so add whatever is
                known — every one is optional.
              </p>
              <div className="grid">
                <GenderField form={form} />
                <MaritalStatusField form={form} update={update} allowBlank />
                {/* For W/O the husband's name above already is the spouse. */}
                {form.guardianRelation !== "W/O" && (
                  <div className="field">
                    <label>Spouse (if applicable)</label>
                    <input
                      value={form.spouse}
                      onChange={(e) => update("spouse", e.target.value)}
                      placeholder="Leave blank if not married"
                    />
                  </div>
                )}
                <div className="field">
                  <label>Qualification</label>
                  <input value={form.qualification} onChange={(e) => update("qualification", e.target.value)} />
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
                  <label>Assistive Devices Provided</label>
                  <input
                    value={form.assistiveDevices}
                    onChange={(e) => update("assistiveDevices", e.target.value)}
                    placeholder="e.g. wheelchair — leave blank if none"
                  />
                </div>
                <div className="field">
                  <label>Source of Income</label>
                  <input value={form.sourceOfIncome} onChange={(e) => update("sourceOfIncome", e.target.value)} />
                </div>
              </div>

              <div className="subhead" style={{ marginTop: 16 }}>Permanent Address</div>
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="sameAsPresent"
                  checked={sameAsPresent}
                  onChange={(e) => toggleSameAsPresent(e.target.checked)}
                />
                <label htmlFor="sameAsPresent">Same as address above</label>
              </div>
              <AddressFields
                value={form.permanentAddress}
                onChange={(v) => update("permanentAddress", v)}
                disabled={sameAsPresent}
                required={hasAnyAddress(form.permanentAddress)}
              />
            </>
          )}
          </>
        ) : (
          <>
            <div className="grid">
              <div className="field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <GenderField form={form} />
              <MaritalStatusField form={form} update={update} />
              <RelationFields form={form} update={update} setRelation={setRelation} />
              {/* For W/O the husband's name above already is the spouse. */}
              {form.guardianRelation !== "W/O" && (
                <div className="field">
                  <label>Spouse (if applicable)</label>
                  <input
                    value={form.spouse}
                    onChange={(e) => update("spouse", e.target.value)}
                    placeholder="Leave blank if not married"
                  />
                </div>
              )}
              <DobField form={form} update={update} setForm={setForm} />
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
              <DisabilityTypeField form={form} update={update} />
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
