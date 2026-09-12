import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Topbar } from "@/components/Topbar";
import { UserForm } from "../UserForm";

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <Topbar session={session} label="Admin" />
      <div className="page">
        <h1>New User</h1>
        <UserForm />
      </div>
    </>
  );
}
