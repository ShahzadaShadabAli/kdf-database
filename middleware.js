import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_HOME = { kdf: "/kdf", swd: "/swd", admin: "/admin" };

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const roleForPath = pathname.startsWith("/kdf")
    ? "kdf"
    : pathname.startsWith("/swd")
    ? "swd"
    : pathname.startsWith("/admin")
    ? "admin"
    : null;

  // /account (change password) is usable by any signed-in role, not just one.
  const anyRole = pathname.startsWith("/account");

  if (!roleForPath && !anyRole) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (anyRole) {
    return NextResponse.next();
  }

  if (token.role !== roleForPath) {
    const homeUrl = new URL(ROLE_HOME[token.role] || "/login", req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/kdf/:path*", "/swd/:path*", "/admin/:path*", "/account/:path*"],
};
