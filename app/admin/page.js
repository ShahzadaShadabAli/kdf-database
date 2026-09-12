import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { Topbar } from "@/components/Topbar";
import Link from "next/link";

export default async function AdminUsersPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const created = searchParams?.created;

  await dbConnect();
  const users = await User.find({})
    .select("username displayName role office createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <>
      <Topbar session={session} label="Admin" />
      <div className="page">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 4,
          }}
        >
          <h1 style={{ margin: 0 }}>Users</h1>
          <Link href="/admin/new" className="btn" style={{ textDecoration: "none" }}>
            + New User
          </Link>
        </div>
        {created && (
          <div
            className="error-banner"
            style={{ background: "#e4eee6", color: "var(--green)", borderColor: "#c7ddcb", marginTop: 12 }}
          >
            User created: {created}
          </div>
        )}
        <div className="card" style={{ marginTop: 16 }}>
          <h3>All accounts {users.length ? `(${users.length})` : ""}</h3>
          {users.length === 0 && <div className="empty-note">No accounts yet.</div>}
          {users.map((u) => (
            <div key={u.username} className="row">
              <div>
                <div className="name">{u.displayName}</div>
                <div className="meta">
                  {u.username} · {u.role}
                  {u.office ? ` · ${u.office}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
