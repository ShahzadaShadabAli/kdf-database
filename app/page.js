import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ROLE_HOME = { kdf: "/kdf", swd: "/swd", admin: "/admin" };

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role) {
    redirect(ROLE_HOME[session.user.role] || "/login");
  }
  redirect("/login");
}
