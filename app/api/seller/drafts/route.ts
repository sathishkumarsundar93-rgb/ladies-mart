import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getSeller } from "../../../../lib/sellerAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  const { rows } = await pool.query(
    "SELECT id, title, data, updated_at FROM product_drafts WHERE seller_id = $1 ORDER BY updated_at DESC LIMIT 20", [s.id]);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  if (s.status !== "approved") return NextResponse.json({ error: "Your account is not approved yet" }, { status: 403 });
  let b: { id?: number; data?: Record<string, unknown> } = {};
  try { b = await req.json(); } catch {}
  const data = b.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
  const json = JSON.stringify(data);
  if (json.length > 60000) return NextResponse.json({ error: "Draft is too large" }, { status: 400 });
  const title = (typeof data.name === "string" && data.name.trim() ? data.name.trim() : "Untitled").slice(0, 120);
  try {
    if (Number.isInteger(b.id)) {
      const r = await pool.query(
        "UPDATE product_drafts SET title = $1, data = $2, updated_at = NOW() WHERE id = $3 AND seller_id = $4 RETURNING id",
        [title, json, b.id, s.id]);
      if (r.rows.length) return NextResponse.json({ id: r.rows[0].id });
    }
    const n = await pool.query("SELECT COUNT(*)::int AS n FROM product_drafts WHERE seller_id = $1", [s.id]);
    if (n.rows[0].n >= 20) return NextResponse.json({ error: "You have 20 drafts. Delete an old draft first." }, { status: 400 });
    const r = await pool.query("INSERT INTO product_drafts (seller_id, title, data) VALUES ($1,$2,$3) RETURNING id", [s.id, title, json]);
    return NextResponse.json({ id: r.rows[0].id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
