"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function UserForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("kdf");
  const [office, setOffice] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, role, office, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create user.");
        return;
      }
      router.push(`/admin?created=${encodeURIComponent(data.username)}`);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h3>New User Account</h3>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. kdf.skardu"
              required
            />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="kdf">KDF</option>
              <option value="swd">Social Welfare</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="field">
            <label>Display Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Office</label>
            <input
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              placeholder="e.g. KDF Skardu / SWD Gilgit (optional)"
            />
          </div>
          <div className="field full">
            <label>Temporary Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 4 }}>
              At least 8 characters. Share this with the user directly (not over an
              unsecured channel) — they can change it themselves after signing in.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <Link href="/admin" className="btn ghost" style={{ textDecoration: "none" }}>
            Cancel
          </Link>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </div>
  );
}
