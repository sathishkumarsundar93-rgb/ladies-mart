import { NextResponse } from "next/server";
import { COOKIE, checkPassword, isAdmin, makeToken } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ admin: isAdmin() });
}

export async function POST(req: Request) {
  let password = "";
  try { password = String((await req.json()).password ?? ""); } catch {}
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ admin: true });
  res.cookies.set(COOKIE, makeToken(), {
    httpOnly: true, sameSite: "lax", path: "/",
    secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 3600,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ admin: false });
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
