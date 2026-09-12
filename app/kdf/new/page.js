import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Topbar } from "@/components/Topbar";
import { KdfForm } from "../KdfForm";

export default async function NewCasePage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <Topbar session={session} label="KDF" />
      <div className="page">
        <h1>New Case</h1>
        <KdfForm mode="create" />
      </div>
    </>
  );
}
