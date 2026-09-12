"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DecisionActions({ cnic }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleDecision(decision) {
    const verb = decision === "verified" ? "Verify" : "Reject";
    if (!confirm(`${verb} this case based on the medical certificate they've brought back?`)) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(cnic)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
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

  return (
    <div className="card">
      <h3>Decision</h3>
      <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "0 0 16px" }}>
        Once the applicant returns with their DHQ medical certificate, record the outcome here.
      </p>
      {error && <div className="error-banner">{error}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn" onClick={() => handleDecision("verified")} disabled={busy} type="button">
          {busy ? "Saving…" : "Verify"}
        </button>
        <button
          className="btn ghost"
          onClick={() => handleDecision("rejected")}
          disabled={busy}
          type="button"
        >
          {busy ? "Saving…" : "Reject"}
        </button>
      </div>
    </div>
  );
}
