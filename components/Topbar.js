"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

const ROLE_HOME = { kdf: "/kdf", swd: "/swd", admin: "/admin" };

export function Topbar({ session, label }) {
  const home = ROLE_HOME[session?.user?.role] || "/login";

  return (
    <div className="topbar">
      <Link
        href={home}
        className="eyebrow"
        style={{ marginBottom: 0, textDecoration: "none" }}
      >
        Karakoram Disability Forum · {label}
      </Link>
      <div className="who">
        <span>
          {session?.user?.name} ({session?.user?.role})
        </span>
        <Link href="/account" className="signout" style={{ textDecoration: "none" }}>
          Change password
        </Link>
        <button className="signout" onClick={() => signOut({ callbackUrl: "/login" })}>
          Sign out
        </button>
      </div>
    </div>
  );
}
