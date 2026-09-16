"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CertificateNoForm({ cnic, initialValue }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(cnic)}/certificate-no`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateNo: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save certificate number.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="field" style={{ margin: 0, minWidth: 200 }}>
        <label>Certificate No.</label>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder="e.g. 0843/2014"
        />
      </div>
      <button className="btn ghost" type="submit" disabled={saving} style={{ padding: "8px 14px" }}>
        {saving ? "Saving…" : "Save"}
      </button>
      {saved && <span style={{ color: "var(--green)", fontSize: 12.5 }}>Saved</span>}
      {error && <span className="field-error">{error}</span>}
    </form>
  );
}
