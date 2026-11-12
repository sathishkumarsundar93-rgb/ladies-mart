import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { isAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rows } = await pool.query(
    `SELECT s.id, s.name, s.owner_name, s.phone, s.status, s.commission_pct, s.created_at,
            (SELECT COUNT(*) FROM products p WHERE p.seller_id = s.id)::int AS products
     FROM sellers s ORDER BY s.id DESC`);
  return NextResponse.json(rows);
}

export async function PATCH(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: { id?: number; status?: string; commission_pct?: number } = {};
  try { b = await req.json(); } catch {}
  if (!Number.isInteger(b.id) || !["pending", "approved", "suspended"].includes(String(b.status))
      || !Number.isInteger(b.commission_pct) || (b.commission_pct as number) < 0 || (b.commission_pct as number) > 50)
    return NextResponse.json({ error: "Invalid values" }, { status: 400 });
  const r = await pool.query("UPDATE sellers SET status = $1, commission_pct = $2 WHERE id = $3", [b.status, b.commission_pct, b.id]);
  if (!r.rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
