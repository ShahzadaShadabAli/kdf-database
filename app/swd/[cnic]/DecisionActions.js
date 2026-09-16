"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DecisionActions({
  cnic,
  initialNatureOfDisability,
  initialCauseOfDisability,
  initialJobType,
  initialSourceOfIncome,
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [fitness, setFitness] = useState("Fit");
  const [natureOfDisability, setNatureOfDisability] = useState(initialNatureOfDisability || "");
  const [causeOfDisability, setCauseOfDisability] = useState(initialCauseOfDisability || "");
  const [jobType, setJobType] = useState(initialJobType || "");
  const [sourceOfIncome, setSourceOfIncome] = useState(initialSourceOfIncome || "");

  async function submitDecision(payload) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(cnic)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not record decision.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  function handleReject() {
    if (!confirm("Reject this case based on the medical certificate they've brought back?")) {
      return;
    }
    submitDecision({ decision: "rejected" });
  }

  function handleVerifySubmit(e) {
    e.preventDefault();
    if (!natureOfDisability.trim()) {
      setError("Nature of disability is required.");
      return;
    }
    submitDecision({
      decision: "verified",
      fitness,
      natureOfDisability,
      causeOfDisability,
      jobType,
      sourceOfIncome,
    });
  }

  return (
    <div className="card">
      <h3>Decision</h3>
      <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "0 0 16px" }}>
        Once the applicant returns with their DHQ medical certificate, record the outcome here.
      </p>
      {error && <div className="error-banner">{error}</div>}

      {showVerifyForm ? (
        <form onSubmit={handleVerifySubmit}>
          <div className="grid">
            <div className="field">
              <label>Fit / Unfit for work</label>
              <select value={fitness} onChange={(e) => setFitness(e.target.value)}>
                <option value="Fit">Fit</option>
                <option value="Unfit">Unfit</option>
              </select>
            </div>
            <div className="field">
              <label>Nature of Disability</label>
              <input
                value={natureOfDisability}
                onChange={(e) => setNatureOfDisability(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Cause of Disability</label>
              <input
                value={causeOfDisability}
                onChange={(e) => setCauseOfDisability(e.target.value)}
                placeholder="e.g. by birth, accident, disease"
              />
            </div>
            <div className="field">
              <label>Type of Job Can Do</label>
              <input value={jobType} onChange={(e) => setJobType(e.target.value)} />
            </div>
            <div className="field">
              <label>Source of Income</label>
              <input value={sourceOfIncome} onChange={(e) => setSourceOfIncome(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Confirm verification"}
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setShowVerifyForm(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => setShowVerifyForm(true)} disabled={busy} type="button">
            Verify
          </button>
          <button className="btn ghost" onClick={handleReject} disabled={busy} type="button">
            {busy ? "Saving…" : "Reject"}
          </button>
        </div>
      )}
    </div>
  );
}
