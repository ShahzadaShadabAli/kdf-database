import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { userCreateSchema } from "@/lib/validation";

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

    await dbConnect();

    const username = data.username.toLowerCase();
    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const created = await User.create({
      username,
      passwordHash,
      role: data.role,
      displayName: data.displayName,
      office: data.office || undefined,
    });

    return NextResponse.json(
      { username: created.username, role: created.role },
      { status: 201 }
    );
  } catch (err) {
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

    await dbConnect();
    const users = await User.find({})
      .select("username displayName role office createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/users failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
