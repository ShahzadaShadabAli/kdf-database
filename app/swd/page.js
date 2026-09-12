import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/models/Case";
import { Topbar } from "@/components/Topbar";
import Link from "next/link";

export default async function SwdListPage() {
  const session = await getServerSession(authOptions);

  await dbConnect();
  // Withdrawn cases never reach Social Welfare — as far as they're
  // concerned, a case KDF pulled back never existed.
  const cases = await Case.find({ status: { $ne: "withdrawn" } })
    .sort({ submittedAt: -1 })
    .select("caseNo cnic name status submittedAt")
    .lean();

  const referred = cases.filter((c) => c.status === "referred");
  const completed = cases.filter((c) => c.status !== "referred");

  return (
    <>
      <Topbar session={session} label="Social Welfare" />
      <div className="page">
        <h1>Cases</h1>

        <div className="card">
          <h3>Referred {referred.length ? `(${referred.length})` : ""}</h3>
          {referred.length === 0 && <div className="empty-note">No cases awaiting a decision.</div>}
          {referred.map((c) => (
            <Link key={c.cnic} href={`/swd/${encodeURIComponent(c.cnic)}`} className="row">
              <div>
                <div className="name">{c.name}</div>
                <div className="meta">
                  {c.caseNo} · {c.cnic}
                </div>
              </div>
              <span className={`badge ${c.status}`}>{c.status}</span>
            </Link>
          ))}
        </div>

        <div className="card">
          <h3>Completed {completed.length ? `(${completed.length})` : ""}</h3>
          {completed.length === 0 && <div className="empty-note">No decisions made yet.</div>}
          {completed.map((c) => (
            <Link key={c.cnic} href={`/swd/${encodeURIComponent(c.cnic)}`} className="row">
              <div>
                <div className="name">{c.name}</div>
                <div className="meta">
                  {c.caseNo} · {c.cnic}
                </div>
              </div>
              <span className={`badge ${c.status}`}>{c.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
