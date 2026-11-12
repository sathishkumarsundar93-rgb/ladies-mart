import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { USER_COOKIE, cookieOpts, hashPassword, makeUserToken, sessionReady } from "../../../../lib/userAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sessionReady()) return NextResponse.json({ error: "Login is not set up on the server yet" }, { status: 500 });
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch {}
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.replace(/\s|-/g, "") : "";
  const password = typeof b.password === "string" ? b.password : "";

  if (name.length < 2 || name.length > 80) return bad("Enter your full name");
  if (!/^[6-9]\d{9}$/.test(phone)) return bad("Enter a valid 10-digit mobile number");
  if (password.length < 6 || password.length > 100) return bad("Password must be at least 6 characters");

  try {
    const r = await pool.query(
      "INSERT INTO users (name, phone, password_hash) VALUES ($1,$2,$3) RETURNING id",
      [name, phone, hashPassword(password)]);
    const res = NextResponse.json({ user: { name, phone } });
    res.cookies.set(USER_COOKIE, makeUserToken(r.rows[0].id), cookieOpts(30 * 24 * 3600));
    return res;
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505")
      return NextResponse.json({ error: "This mobile number is already registered. Please login." }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
