import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listCases } from "@/lib/db";
import { Topbar } from "@/components/Topbar";
import { SwdCaseSections } from "./SwdCaseSections";

export default async function SwdListPage() {
  const session = await getServerSession(authOptions);

  // Withdrawn cases never reach Social Welfare — as far as they're
  // concerned, a case KDF pulled back never existed.
  const cases = (await listCases()).filter((c) => c.status !== "withdrawn");

  return (
    <>
      <Topbar session={session} label="Social Welfare" />
      <div className="page" style={{ maxWidth: 1400 }}>
        <h1>Cases</h1>
        <SwdCaseSections cases={JSON.parse(JSON.stringify(cases))} />
      </div>
    </>
  );
}
