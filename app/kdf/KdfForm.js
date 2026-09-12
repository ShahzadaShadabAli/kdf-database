"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CnicInput, CNIC_REGEX } from "@/components/CnicInput";
import { AddressFields } from "@/components/AddressFields";

const EMPTY_ADDRESS = { uc: "", tehsil: "", district: "" };

const EMPTY_FORM = {
  name: "",
  gender: "Male",
  maritalStatus: "Single",
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

function addressesEqual(a, b) {
  return a.uc === b.uc && a.tehsil === b.tehsil && a.district === b.district;
}

export function KdfForm({ mode = "create", initialData = null }) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(initialData || EMPTY_FORM);
  // The CNIC this record was fetched under — used to address the API route
  // even if the user edits the CNIC field itself (e.g. fixing a typo).
  const [originalCnic] = useState(initialData?.cnic || null);
  const [sameAsPresent, setSameAsPresent] = useState(
    !!initialData && addressesEqual(initialData.presentAddress, initialData.permanentAddress)
  );
  const [cnicError, setCnicError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
      <h3>{isEdit ? "Edit Case — Applicant Details" : "New Case — Applicant Details"}</h3>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
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
              <option value="Hearing">Hearing</option>
              <option value="Mentally">Mentally</option>
            </select>
          </div>
          <div className="field">
            <label>Nature of Disability</label>
            <input
              value={form.natureOfDisability}
              onChange={(e) => update("natureOfDisability", e.target.value)}
              required
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
              : "Submit case for Social Welfare"}
          </button>
        </div>
      </form>
    </div>
  );
}
