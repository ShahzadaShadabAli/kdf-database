"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RestoreButton({ cnic }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleRestore() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(cnic)}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not restore case.");
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        className="btn ghost"
        style={{ padding: "4px 10px", fontSize: 12 }}
        onClick={handleRestore}
        disabled={busy}
        type="button"
      >
        {busy ? "Restoring…" : "Restore"}
      </button>
      {error && <span className="field-error">{error}</span>}
    </span>
  );
}
