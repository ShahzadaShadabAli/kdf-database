"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Permanent delete, behind a confirmation that asks for DELETE to be typed —
// unlike Withdraw, this can't be undone.
export function DeleteCaseButton({ cnic, caseNo, name, redirectTo, size = "small" }) {
  const router = useRouter();
  const dialogRef = useRef(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputId = `delete-confirm-${caseNo}`;

  function open() {
    setTyped("");
    setError("");
    dialogRef.current?.showModal();
  }

  async function confirmDelete(e) {
    e.preventDefault();
    if (typed !== "DELETE") return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(cnic)}/permanent`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not delete this case.");
        setBusy(false);
        return;
      }
      dialogRef.current?.close();
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn ghost danger"
        style={size === "small" ? { padding: "4px 10px", fontSize: 12 } : undefined}
        onClick={open}
      >
        Delete
      </button>
      <dialog ref={dialogRef} className="assess-dialog" aria-labelledby={`${inputId}-title`}>
        <form onSubmit={confirmDelete}>
          <h3 id={`${inputId}-title`}>Delete this case permanently?</h3>
          <p className="assess-lede">
            <strong>{caseNo}</strong> — {name}. The case and its history are removed for good, and this can&apos;t be
            undone. To keep it on record but out of Social Welfare&apos;s queue, withdraw it instead.
          </p>
          <div className="field">
            <label htmlFor={inputId}>Type DELETE to confirm</label>
            <input
              id={inputId}
              value={typed}
              onChange={(e) => setTyped(e.target.value.toUpperCase())}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
          </div>
          {error && <div className="field-error">{error}</div>}
          <div className="assess-actions">
            <button type="button" className="btn ghost" onClick={() => dialogRef.current?.close()} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn danger-solid" disabled={typed !== "DELETE" || busy}>
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
