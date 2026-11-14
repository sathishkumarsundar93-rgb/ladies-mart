import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getSeller } from "../../../../lib/sellerAuth";
import { parseProduct } from "../../../../lib/productForm";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  const { rows } = await pool.query(
    `SELECT id, name, category, sku, price, old_price, stock, stock_by_size, active, approval, reject_reason, image
     FROM products WHERE seller_id = $1 ORDER BY id DESC`, [s.id]);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  if (s.status !== "approved") return NextResponse.json({ error: "Your account is not approved yet" }, { status: 403 });

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch {}
  const r = parseProduct(b);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });

  const row: Record<string, unknown> = { ...r.data, seller_id: s.id, approval: "pending", declared_at: new Date() };
  const keys = Object.keys(row);
  try {
    const q = await pool.query(
      `INSERT INTO products (${keys.join(", ")}) VALUES (${keys.map((_, i) => "$" + (i + 1)).join(", ")}) RETURNING id`,
      keys.map((k) => row[k]));
    const draftId = Number(b.draftId);
    if (Number.isInteger(draftId)) await pool.query("DELETE FROM product_drafts WHERE id = $1 AND seller_id = $2", [draftId, s.id]);
    return NextResponse.json({ id: q.rows[0].id });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505")
      return NextResponse.json({ error: "You already used this SKU / product code. Use a different code." }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
                                             }
