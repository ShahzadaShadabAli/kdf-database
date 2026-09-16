import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listCases } from "@/lib/db";
import { Topbar } from "@/components/Topbar";
import Link from "next/link";
import { KdfCaseSections } from "./KdfCaseSections";

export default async function KdfListPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const created = searchParams?.created;

  const cases = await listCases();

  const referredCount = cases.filter((c) => c.status === "referred").length;
  const verifiedCount = cases.filter((c) => c.status === "verified").length;
  const rejectedCount = cases.filter((c) => c.status === "rejected").length;

  return (
    <>
      <Topbar session={session} label="KDF" />
      <div className="page" style={{ maxWidth: 1400 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 4,
          }}
        >
          <h1 style={{ margin: 0 }}>Cases</h1>
          <Link href="/kdf/new" className="btn" style={{ textDecoration: "none" }}>
            + New Case
          </Link>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <span className="badge referred">Referred: {referredCount}</span>
          <span className="badge verified">Verified: {verifiedCount}</span>
          <span className="badge rejected">Rejected: {rejectedCount}</span>
        </div>

        {created && (
          <div
            className="error-banner"
            style={{ background: "#e4eee6", color: "var(--green)", borderColor: "#c7ddcb", marginTop: 12 }}
          >
            Case submitted: {created}
          </div>
        )}

        <KdfCaseSections cases={JSON.parse(JSON.stringify(cases))} />
      </div>
    </>
  );
}
