import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Topbar } from "@/components/Topbar";
import { ChangePasswordForm } from "./ChangePasswordForm";

const LABELS = { kdf: "KDF", swd: "Social Welfare", admin: "Admin" };

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const label = LABELS[session?.user?.role] || "Account";

  return (
    <>
      <Topbar session={session} label={label} />
      <div className="page">
        <h1>Account</h1>
        <ChangePasswordForm />
      </div>
    </>
  );
}
