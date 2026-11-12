import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { getSeller } from "../../../../../lib/sellerAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  if (s.status !== "approved") return NextResponse.json({ error: "Your account is not approved" }, { status: 403 });
  const id = Number(params.id);
  let b: { price?: number; old_price?: number; stock?: number; active?: boolean } = {};
  try { b = await req.json(); } catch {}
  const okInt = (v: unknown, max: number) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max;
  if (!Number.isInteger(id) || !okInt(b.price, 1000000) || !okInt(b.old_price, 1000000) || !okInt(b.stock, 100000) || typeof b.active !== "boolean"
      || (b.price as number) < 1 || (b.old_price as number) < (b.price as number))
    return NextResponse.json({ error: "Invalid values (MRP must be equal or more than price)" }, { status: 400 });
  try {
    const r = await pool.query(
      "UPDATE products SET price = $1, old_price = $2, stock = $3, active = $4 WHERE id = $5 AND seller_id = $6",
      [b.price, b.old_price, b.stock, b.active, id, s.id]);
    if (!r.rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
