import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { getUser, setUserPassword } from "@/lib/db";
import { passwordChangeSchema } from "@/lib/validation";

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await getUser(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    await setUserPassword(user.username, await bcrypt.hash(newPassword, 10));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/account/password failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
