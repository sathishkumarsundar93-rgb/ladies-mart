import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { USER_COOKIE, cookieOpts, makeUserToken, sessionReady, verifyPassword } from "../../../../lib/userAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sessionReady()) return NextResponse.json({ error: "Login is not set up on the server yet" }, { status: 500 });
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch {}
  const phone = typeof b.phone === "string" ? b.phone.replace(/\s|-/g, "") : "";
  const password = typeof b.password === "string" ? b.password : "";

  try {
    const { rows } = await pool.query("SELECT id, name, phone, password_hash FROM users WHERE phone = $1", [phone]);
    const u = rows[0];
    if (!u || !verifyPassword(password, u.password_hash)) {
      await new Promise((r) => setTimeout(r, 700)); // slow down guessing
      return NextResponse.json({ error: "Wrong mobile number or password" }, { status: 401 });
    }
    const res = NextResponse.json({ user: { name: u.name, phone: u.phone } });
    res.cookies.set(USER_COOKIE, makeUserToken(u.id), cookieOpts(30 * 24 * 3600));
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
