import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getSeller } from "../../../../lib/sellerAuth";

export const dynamic = "force-dynamic";

// Link several of the seller's own products as "similar products"
export async function POST(req: Request) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  let b: { ids?: unknown } = {};
  try { b = await req.json(); } catch {}
  const ids = Array.isArray(b.ids) ? [...new Set(b.ids.map(Number))].filter((n) => Number.isInteger(n)) : [];
  if (ids.length < 2 || ids.length > 12) return NextResponse.json({ error: "Select 2 to 12 products" }, { status: 400 });
  try {
    const { rows } = await pool.query("SELECT id, group_id FROM products WHERE id = ANY($1::int[]) AND seller_id = $2", [ids, s.id]);
    if (rows.length !== ids.length) return NextResponse.json({ error: "Some products were not found" }, { status: 404 });
    const existing = rows.map((r) => r.group_id).filter((g): g is number => typeof g === "number");
    const gid = existing.length ? Math.min(...existing) : Math.min(...ids);
    await pool.query("UPDATE products SET group_id = $1 WHERE id = ANY($2::int[]) OR group_id = ANY($3::int[])", [gid, ids, existing.length ? existing : [0]]);
    return NextResponse.json({ ok: true, group_id: gid });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
