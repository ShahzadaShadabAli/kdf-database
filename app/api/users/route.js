import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { DbError, createUser, listUsers } from "@/lib/db";
import { userCreateSchema } from "@/lib/validation";

// Every response depends on who is signed in, so this must never be rendered
// at build time or cached. Declaring it up front also stops `next build` from
// test-rendering it and logging a "Dynamic server usage" error.
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const username = data.username.toLowerCase();

    await createUser({
      username,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: data.role,
      displayName: data.displayName,
      office: data.office || undefined,
      createdAt: new Date(),
    });

    return NextResponse.json({ username, role: data.role }, { status: 201 });
  } catch (err) {
    if (err instanceof DbError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("POST /api/users failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ users: await listUsers() });
  } catch (err) {
    console.error("GET /api/users failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
