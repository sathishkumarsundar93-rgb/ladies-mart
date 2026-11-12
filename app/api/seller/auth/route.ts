import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { cookieOpts, hashPassword, sessionReady, verifyPassword } from "../../../../lib/userAuth";
import { SELLER_COOKIE, getSeller, makeSellerToken } from "../../../../lib/sellerAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json({ seller: await getSeller() }); }
  catch (e) { console.error(e); return NextResponse.json({ seller: null }); }
}

export async function POST(req: Request) {
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch {}
  const mode = String(b.mode ?? "");

  if (mode === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SELLER_COOKIE, "", cookieOpts(0));
    return res;
  }
  if (!sessionReady()) return NextResponse.json({ error: "Login is not set up on the server yet" }, { status: 500 });

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const phone = str(b.phone).replace(/\s|-/g, "");
  const password = typeof b.password === "string" ? b.password : "";

  try {
    if (mode === "register") {
      const name = str(b.name), owner = str(b.owner);
      if (name.length < 2 || name.length > 80) return bad("Enter your shop / business name");
      if (owner.length < 2 || owner.length > 80) return bad("Enter owner name");
      if (!/^[6-9]\d{9}$/.test(phone)) return bad("Enter a valid 10-digit mobile number");
      if (password.length < 6 || password.length > 100) return bad("Password must be at least 6 characters");
      const r = await pool.query(
        "INSERT INTO sellers (name, owner_name, phone, password_hash) VALUES ($1,$2,$3,$4) RETURNING id",
        [name, owner, phone, hashPassword(password)]);
      const res = NextResponse.json({ ok: true });
      res.cookies.set(SELLER_COOKIE, makeSellerToken(r.rows[0].id), cookieOpts(30 * 24 * 3600));
      return res;
    }
    if (mode === "login") {
      const { rows } = await pool.query("SELECT id, password_hash FROM sellers WHERE phone = $1", [phone]);
      const u = rows[0];
      if (!u || !verifyPassword(password, u.password_hash)) {
        await new Promise((r) => setTimeout(r, 700));
        return NextResponse.json({ error: "Wrong mobile number or password" }, { status: 401 });
      }
      const res = NextResponse.json({ ok: true });
      res.cookies.set(SELLER_COOKIE, makeSellerToken(u.id), cookieOpts(30 * 24 * 3600));
      return res;
    }
    return bad("Invalid request");
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
