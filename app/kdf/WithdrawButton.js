"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WithdrawButton({ cnic }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleWithdraw() {
    if (!confirm("Withdraw this case? It will be removed from Social Welfare's active queue.")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(cnic)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not withdraw case.");
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
        onClick={handleWithdraw}
        disabled={busy}
        type="button"
      >
        {busy ? "Withdrawing…" : "Withdraw"}
      </button>
      {error && <span className="field-error">{error}</span>}
    </span>
  );
}
